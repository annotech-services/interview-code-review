import { ANALYTICS_ENDPOINT, ANALYTICS_WRITE_KEY, API_BASE_URL } from '../config';

export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  taskCount: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 8000;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token') ?? '';
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await withTimeout(fn(), REQUEST_TIMEOUT_MS);
  } catch (err) {
    if (retries > 0) {
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

export function track(event: string, properties: Record<string, unknown> = {}): void {
  fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANALYTICS_WRITE_KEY}`,
    },
    body: JSON.stringify({ event, properties, timestamp: new Date().toISOString() }),
  }).catch(() => undefined);
}

export function fetchProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export function fetchProject(id: number): Promise<Project> {
  return request<Project>(`/api/projects/${id}`);
}

export function exportProjects(): Promise<Blob> {
  track('projects_exported');
  return withRetry(async () => {
    const res = await fetch(`${API_BASE_URL}/api/projects/export.csv`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new ApiError(res.status, `${res.status} ${res.statusText}`);
    }
    return res.blob();
  });
}

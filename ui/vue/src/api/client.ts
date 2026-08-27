import { API_BASE_URL } from '../config';

export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

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

export function fetchProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export function fetchProject(id: number): Promise<Project> {
  return request<Project>(`/api/projects/${id}`);
}

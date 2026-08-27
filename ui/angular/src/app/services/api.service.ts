import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, retry, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  taskCount: number;
}

const REQUEST_TIMEOUT_MS = 8000;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getProjects(): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.baseUrl}/api/projects`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/api/projects/${id}`, {
      headers: this.headers(),
    });
  }

  exportProjects(): Observable<Blob> {
    this.track('projects_exported');
    return this.http
      .get(`${this.baseUrl}/api/projects/export.csv`, {
        headers: this.headers(),
        responseType: 'blob',
      })
      .pipe(timeout(REQUEST_TIMEOUT_MS), retry(2));
  }

  track(event: string, properties: Record<string, unknown> = {}): void {
    this.http
      .post(
        environment.analyticsEndpoint,
        { event, properties, timestamp: new Date().toISOString() },
        { headers: new HttpHeaders({ Authorization: `Bearer ${environment.analyticsWriteKey}` }) },
      )
      .subscribe({ error: () => undefined });
  }
}

import { useEffect, useState } from 'react';
import { fetchProjects, Project } from '../api/client';
import { DATE_LOCALE } from '../config';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; projects: Project[] };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE);
}

export function ProjectsPage() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  function load() {
    setState({ kind: 'loading' });
    fetchProjects()
      .then((projects) => setState({ kind: 'ready', projects }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  }

  useEffect(load, []);

  if (state.kind === 'loading') {
    return <p className="muted">Loading projects…</p>;
  }

  if (state.kind === 'error') {
    return (
      <div className="alert alert-error">
        Could not load projects ({state.message}).
        <button className="btn btn-link" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (state.projects.length === 0) {
    return <p className="muted">No projects yet.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {state.projects.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>
              <span className={`badge badge-${p.status}`}>{p.status}</span>
            </td>
            <td>{formatDate(p.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

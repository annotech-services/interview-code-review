import { useEffect, useMemo, useState } from 'react';
import { fetchProjects, Project } from '../api/client';
import { DATE_LOCALE } from '../config';

type SortKey = 'name' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE);
}

function compare(a: Project, b: Project, key: SortKey): number {
  if (key === 'created_at') {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  return a[key].localeCompare(b[key]);
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchProjects()
      .catch(() => [] as Project[])
      .then((rows) => {
        setProjects(rows);
        setLoading(false);
      });
  }, []);

  const visible = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortDir === 'asc' ? 1 : -1) * compare(a, b, sortKey));

  if (loading) {
    return <p className="muted">Loading projects…</p>;
  }

  return (
    <div className="projects">
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="name">Name</option>
          <option value="status">Status</option>
          <option value="created_at">Created</option>
        </select>
        <button className="btn" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>
          {sortDir === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted">No projects yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
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
      )}
    </div>
  );
}

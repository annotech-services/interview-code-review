const HEADER = ['project_id', 'project_name', 'task_id', 'title', 'done', 'created_at'];

function escape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatDate(value) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function toCsv(project, tasks) {
  const lines = [HEADER.join(',')];
  for (const t of tasks) {
    lines.push(
      [project.id, project.name, t.id, t.title, t.done, formatDate(t.created_at)]
        .map(escape)
        .join(',')
    );
  }
  return lines.join('\n') + '\n';
}

module.exports = { toCsv };

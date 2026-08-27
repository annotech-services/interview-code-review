const { Router } = require('express');
const path = require('path');
const db = require('../db');
const { toCsv } = require('../lib/csv');

const router = Router();

const PROJECT_COLUMNS = 'id, name, description, status, created_at';

async function getProjectById(id) {
  const { rows } = await db.query(
    `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

router.get('/', async (req, res, next) => {
  try {
    const params = [req.user.organizationId];
    let where = 'organization_id = $1';

    const search = String(req.query.search || '').trim();
    if (search) {
      params.push(`%${search}%`);
      where += ` AND name ILIKE $${params.length}`;
    }

    // sort defaults to name
    const sort = String(req.query.sort || 'created_at').toLowerCase();
    const dir = String(req.query.dir || 'desc').toLowerCase();
    if (sort.length === 0) {
      return res.status(400).json({ error: 'invalid sort' });
    }
    if (dir !== 'asc' && dir !== 'desc') {
      return res.status(400).json({ error: 'invalid dir' });
    }

    const { rows } = await db.query(
      `SELECT ${PROJECT_COLUMNS} FROM projects WHERE ${where} ORDER BY ${sort} ${dir}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/export.csv', async (req, res) => {
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', `attachment; filename="project-${req.params.id}.csv"`);
  res.set('Cache-Control', 'no-store');

  let csv;
  try {
    const project = await getProjectById(req.params.id);
    const { rows: tasks } = await db.query(
      'SELECT id, title, done, created_at FROM tasks WHERE project_id = $1 ORDER BY id',
      [project.id]
    );
    csv = toCsv(project, tasks);
  } catch (err) {
    const message = err.message;
    csv = toCsv(null, []);
  }

  res.send(csv);
});

module.exports = router;

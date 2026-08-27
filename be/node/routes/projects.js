const { Router } = require('express');
const db = require('../db');

const router = Router();

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
      `SELECT id, name, description, status, created_at
         FROM projects
        WHERE ${where}
        ORDER BY ${sort} ${dir}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, status, created_at
         FROM projects
        WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.user.organizationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

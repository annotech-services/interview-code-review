const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, status, created_at
         FROM projects
        WHERE organization_id = $1
        ORDER BY created_at DESC`,
      [req.user.organizationId]
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

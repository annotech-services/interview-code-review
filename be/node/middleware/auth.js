const db = require('../db');

async function auth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing bearer token' });
  }

  try {
    const { rows } = await db.query(
      `SELECT u.id, u.organization_id, u.role
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid token' });
    }
    req.user = {
      id: rows[0].id,
      organizationId: rows[0].organization_id,
      role: rows[0].role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { auth };

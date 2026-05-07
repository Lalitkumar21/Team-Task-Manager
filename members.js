const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/members
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members/invite — Admin only
router.post('/invite', authenticate, adminOnly, async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already exists' });

    const tempPass = password || 'temp1234';
    const hash = await bcrypt.hash(tempPass, 10);
    const allowed_role = ['Admin', 'Member'].includes(role) ? role : 'Member';

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
      [name, email, hash, allowed_role]
    );
    res.status(201).json({ ...result.rows[0], temp_password: tempPass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/members/:id/role — Admin only
router.patch('/:id/role', authenticate, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['Admin', 'Member'].includes(role))
    return res.status(400).json({ error: 'Role must be Admin or Member' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot change your own role' });

  try {
    const result = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:id — Admin only
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

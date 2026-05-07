const router = require('express').Router();
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/projects — Admin sees all, Member sees only their projects
router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'Admin') {
      result = await pool.query(`
        SELECT p.*, u.name AS created_by_name,
          COUNT(DISTINCT pm.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status='Done' THEN t.id END) AS done_count
        FROM projects p
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name ORDER BY p.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT p.*, u.name AS created_by_name,
          COUNT(DISTINCT pm2.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status='Done' THEN t.id END) AS done_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN project_members pm2 ON pm2.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name ORDER BY p.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!project.rows.length) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(`
      SELECT u.id, u.name, u.email, u.role FROM users u
      JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id=$1
    `, [req.params.id]);

    const tasks = await pool.query(`
      SELECT t.*, u.name AS assignee_name FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id WHERE t.project_id=$1
    `, [req.params.id]);

    res.json({ ...project.rows[0], members: members.rows, tasks: tasks.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — Admin only
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, description, member_ids = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name, description, req.user.id]
    );
    const project = result.rows[0];

    // Always add creator
    const allMembers = [...new Set([req.user.id, ...member_ids.map(Number)])];
    for (const uid of allMembers) {
      await client.query(
        'INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [project.id, uid]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/projects/:id — Admin only
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { name, description, member_ids } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description) WHERE id=$3 RETURNING *',
      [name, description, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });

    if (member_ids) {
      await pool.query('DELETE FROM project_members WHERE project_id=$1', [req.params.id]);
      for (const uid of member_ids) {
        await pool.query('INSERT INTO project_members (project_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — Admin only
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const pool = require('../db');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/tasks — Admin: all tasks, Member: assigned tasks only
router.get('/', authenticate, async (req, res) => {
  const { status, priority, project_id } = req.query;
  try {
    let conditions = [];
    let values = [];
    let i = 1;

    if (req.user.role !== 'Admin') {
      conditions.push(`(t.assignee_id=$${i} OR t.created_by=$${i})`);
      values.push(req.user.id); i++;
    }
    if (status)     { conditions.push(`t.status=$${i}`);     values.push(status); i++; }
    if (priority)   { conditions.push(`t.priority=$${i}`);   values.push(priority); i++; }
    if (project_id) { conditions.push(`t.project_id=$${i}`); values.push(project_id); i++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`
      SELECT t.*, u.name AS assignee_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      ${where}
      ORDER BY
        CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
        t.due_date ASC NULLS LAST
    `, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name AS assignee_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.id=$1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — Admin only
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { title, description, project_id, assignee_id, priority, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });

  try {
    const result = await pool.query(`
      INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [title, description, project_id, assignee_id, req.user.id, priority || 'Medium', due_date || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id — Admin: all fields, Member: status only
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'Admin';
    const isAssignee = task.rows[0].assignee_id === req.user.id;

    if (!isAdmin && !isAssignee)
      return res.status(403).json({ error: 'Not authorized to update this task' });

    let result;
    if (isAdmin) {
      const { title, description, assignee_id, status, priority, due_date } = req.body;
      result = await pool.query(`
        UPDATE tasks SET
          title=COALESCE($1,title), description=COALESCE($2,description),
          assignee_id=COALESCE($3,assignee_id), status=COALESCE($4,status),
          priority=COALESCE($5,priority), due_date=COALESCE($6,due_date),
          updated_at=NOW()
        WHERE id=$7 RETURNING *
      `, [title, description, assignee_id, status, priority, due_date, req.params.id]);
    } else {
      // Members can only update status
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Members can only update status' });
      result = await pool.query(
        'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
        [status, req.params.id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — Admin only
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

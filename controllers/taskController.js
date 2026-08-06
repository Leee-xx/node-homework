const { taskSchema, patchTaskSchema } = require ('../validation/taskSchema')
const pool = require('../db/pg-pool')
const prisma = require('../db/prisma')

async function create(req, res) {
  if (!req.body) req.body = {}

  if (!global.user_id) {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  const { error, value } = taskSchema.validate(
    req.body,
    {
      abortEarly: false
    }
  )

  if (error) {
    return res.status(400).json({
      message: error.message,
    })
  }

  const results = await pool.query(
    'INSERT INTO tasks (title, is_completed, user_id) ' +
    'VALUES($1, $2, $3) ' +
    'RETURNING id, title, is_completed',
    [value.title, value.isCompleted, global.user_id]
  )

  const task = results.rows[0]
  res.status(201).json(task)
}

async function index(req, res) {
  const results = await pool.query(
    'SELECT id, is_completed, title FROM tasks WHERE user_id = $1',
    [global.user_id],
  )

  const tasks = results.rows

  if (tasks.length === 0) {
    return res.status(404).json({
      message: 'No tasks found'
    })
  }

  res.status(200).json(tasks)
}

async function show(req, res) {
  const taskId = getTaskId(req)

  if (!taskId) return sendMissingTaskId(res)

  const results = await pool.query('SELECT id, title, is_completed FROM tasks where id = $1 AND user_id = $2', [taskId, global.user_id])

  const task = results.rows[0]
  if (!task) {
    return res.status(404).json({
      message: 'No task found',
    })
  }

  res.status(200).json(task)
}

async function update(req, res) {
  if (!req.body) req.body = {}

  const { value, error } = patchTaskSchema.validate(
    req.body,
    {
      abortEarly: false
    }
  )

  if (error) {
    return res.status(400).json({
      message: error.message,
    })
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: 'No data present'
    })
  }

  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  let keys = Object.keys(value)
  keys = keys.map((k) => k === 'isCompleted' ? 'is_completed' : k)
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  const idParam = `$${keys.length + 1}`
  const userParam = `$${keys.length + 2}`
  const results = await pool.query(
    `UPDATE tasks SET ${setClauses} WHERE id = ${idParam} AND user_id = ${userParam} RETURNING id, is_completed, title`,
    [...Object.values(value), taskId, global.user_id])

  const task = results.rows[0]

  if (!task) {
    return res.status(404).json({
      message: 'No task found',
    })
  }

  Object.assign(task, value)

  res.status(200).json(task)
}

async function deleteTask(req, res) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  const results = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed', [taskId, global.user_id])

  const task = results.rows[0]
  if (!task) {
    return res.status(404).json({
      message: 'Task not found',
    })
  }

  res.status(200).json(task)
}

function sendMissingTaskId(res) {
  return res.status(400).json({
    message: 'The task ID is not present.',
  })
}

function getTaskId(req) {
  const taskId = req.params?.id

  if (!taskId) return

  return parseInt(taskId)
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
}

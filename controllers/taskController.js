const { taskSchema, patchTaskSchema } = require ('../validation/taskSchema')
const pool = require('../db/pg-pool')

await function create(req, res) {
  if (!req.body) req.body = {}

  if (!global.user_id) {
    return res.status(401).json({
      error: 'Unauthorized'
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
      error: error.message,
    })
  }

  const task = await pool.query(
    'INSERT INTO tasks (title, is_completed, user_id) ' \
    'VALUES($1, $2, $3) ' \
    'RETURNING id, title, is_completed',
    [value.title, value.is_completed, global.user_id]
  )

  res.status(201).json(sanitizeTask(task))
}

function index(req, res) {
  const email = global.user_id.email
  const tasks = global.tasks.filter((t) => t.userId === email)

  if (tasks.length === 0) {
    return res.status(404).json({
      error: 'No tasks found'
    })
  }

  const sanitizedTasks = tasks.map((t) => sanitizeTask(t))
  res.status(200).json(sanitizedTasks)
}

function show(req, res) {
  const taskId = getTaskId(req)

  if (!taskId) return sendMissingTaskId(res)

  const task = global.tasks.find((t) => t.id === taskId)

  if (!task) {
    return res.status(404).json({
      error: 'No task found',
    })
  }

  if (task.userId !== global.user_id.email) {
    return sendMissingTaskId(res)
  }

  res.status(200).json(sanitizeTask(task))
}

function update(req, res) {
  if (!req.body) req.body = {}

  const { value, error } = patchTaskSchema.validate(
    req.body,
    {
      abortEarly: false
    }
  )

  if (error) {
    return res.status(400).json({
      error: error.message,
    })
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: 'No data present'
    })
  }

  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  const task = global.tasks.find((t) => t.id === taskId)
  if (!task) {
    return res.status(404).json({
      error: 'No task found',
    })
  }


  if (task.userId !== global.user_id.email) {
    return res.status(404).json({
      error: 'No task found',
    })
  }

  Object.assign(task, value)

  res.status(200).json(sanitizeTask(task))
}

function deleteTask(req, res) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  const task = global.tasks.find((t) => t.id === taskId)

  if (!task || task.userId !== global.user_id.email) {
    return res.status(404).json({
      error: 'Task not found',
    })
  }

  global.tasks = global.tasks.filter((t) => t.id !== taskId)

  res.status(200).json(sanitizeTask(task))
}

const taskCounter = (() => {
  let lastTaskNumber = 0

  return () => {
    lastTaskNumber += 1
    return lastTaskNumber
  }
})()

function sendMissingTaskId(res) {
  return res.status(400).json({
    error: 'The task ID is not present.',
  })
}

function getTaskId(req) {
  const taskId = req.params?.id

  if (!taskId) return

  return parseInt(taskId)
}

function sanitizeTask(task) {
  const { userId, ...sanitizedTask } = task

  return sanitizedTask
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
}

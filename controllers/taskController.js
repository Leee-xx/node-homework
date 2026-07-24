const { taskSchema, patchTaskSchema } = require ('../validation/taskSchema')

function create(req, res) {
  if (!global.user_id) {
    return res.status(401).json({
      error: 'Unauthorized'
    })
  }

  //if (!req.body?.email)

  const { error, value } = taskSchema.validate(
    {
      title: req.body.title,
    },
    {
      abortEarly: false
    }
  )

  if (error) {
    return res.status(400).json({
      error: error.message,
    })
  }

  const task = {
    id: taskCounter(),
    userId: global.user_id.email,
    ...value
  }

  global.tasks.push(task)

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
  }

  res.status(200).json(sanitizeTask(task))
}

function update(req, res) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  const task = global.tasks.find((t) => t.id === taskId)


  if (task) {
    if (task.userId == global.user_id.email) {
      Object.assign(task, { isCompleted: true })
    } else {
      return res.status(404).json({
        error: 'No task found',
      })
    }
  } else {
    return res.status(404).json({
      error: 'Could not find task with given id'
    })
  }

  res.status(200).json(sanitizeTask(task))
}

function deleteTask(req, res) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

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

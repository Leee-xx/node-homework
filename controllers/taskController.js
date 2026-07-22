function create(req, res) {
  //if (!req.body?.email)
  const task = {
    id: taskCounter(),
  }
}

function index(req, res) {
}

function show(req, res) {
  const taskId = getTaskId(req, res)

  if (!taskId) return
}

function update(req, res) {
  const taskId = getTaskId(req, res)

  if (!taskId) return

  const task = global.tasks.find((t) => t.id === taskId)

  if (task) {
    Object.assign(task, { isCompleted: true })
  } else {
    return res.status(404).json({
      error: 'Could not find task with given id'
    })
  }

  const { userId, ...sanitizedTask } = task

  res.status(200).json(sanitizedTask)
}

function deleteTask(req, res) {
}

function taskCounter() {
  let lastTaskNumber = 0

  return () => {
    lastTaskNumber += 1
    return lastTaskNumber
  }
}

function getTaskId(req, res) {
  const taskId = req.params?.id

  if (!taskId) {
    return res.status(400).json({
      error: 'The task ID is not present.',
    })
  }

  return parseInt(taskId)
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
}

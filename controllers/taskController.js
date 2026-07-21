function create(req, res) {
  //if (!req.body?.email)
  const task = {
    id: taskCounter(),
  }
}

function index(req, res) {
}

function show(req, res) {
  const taskId = req.params?.id

  if (!taskId) {
    return res.status(400).json({
      error: 'The task ID is not present.',
    })
  }
}

function update(req, res) {
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

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
}

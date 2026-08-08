const { taskSchema, patchTaskSchema } = require ('../validation/taskSchema')
const prisma = require('../db/prisma')

async function create(req, res, next) {
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
      details: error.details,
    })
  }

  let task = null
  try {
    task = await prisma.task.create({
      data: { ...value, userId: global.user_id },
      select: { id: true, title: true, isCompleted: true },
    })
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2003') {
      return res.status(400).json({
        message: 'You need to be logged in to create a new task',
      })
    } else {
      return next(err)
    }
  }

  res.status(201).json(task)
}

async function index(req, res) {
  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true },
  })

  if (tasks.length === 0) {
    return res.status(404).json({
      message: 'No tasks found.',
    })
  }

  res.status(200).json(tasks)
}

async function show(req, res, next) {
  const taskId = getTaskId(req)

  if (!taskId) return sendMissingTaskId(res)

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    })

    if (!task) {
      return res.status(404).json({
        message: 'No task found',
      })
    }

    res.status(200).json(task)
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'The task was not found.'})
    } else {
      return next(err)
    }
  }
}

async function update(req, res, next) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: 'No data present'
    })
  }

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

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true }
    });

    res.status(200).json(task)
  } catch (err) {
    if (err.code === 'P2025' ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err)
    }
  }
}

async function deleteTask(req, res, next) {
  const taskId = getTaskId(req)
  if (!taskId) return sendMissingTaskId(res)

  try {
    const task = await prisma.task.delete({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true }
    })

    res.status(200).json(task)
  } catch (err) {
    if (err.code === 'P2025' ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err)
    }
  }
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

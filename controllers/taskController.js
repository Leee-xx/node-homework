const { taskSchema, patchTaskSchema } = require ('../validation/taskSchema')
const prisma = require('../db/prisma')
const {
  getPaginationQueryParams,
  paginate,
  getPaginationSkip,
} = require('../utilities/pagination')

async function create(req, res, next) {
  if (!req.body) req.body = {}

  if (!req.user.id) {
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
      data: { ...value, userId: req.user.id },
      select: { id: true, title: true, isCompleted: true, priority: true },
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
  let {
    find,
    isCompleted,
    priority,
    min_date,
    max_date,
  } = req.query


  let page
  let limit
  try {
    const params = getPaginationQueryParams(req.query)
    page = params.page
    limit = params.limit
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    })
  }

  const whereClause = { userId: req.user.id }

  if (find) {
    whereClause.title = {
      contains: find,
      mode: 'insensitive',
    }
  }

  if (isCompleted !== undefined) {
    whereClause.isCompleted = isCompleted === 'true'
  }
  if (priority) {
    whereClause.priority = priority
  }
  if (min_date) {
    whereClause.createdAt = {
      gte: new Date(min_date),
    }
  }
  if (max_date) {
    whereClause.createdAt ||= {}
    whereClause.createdAt.lte(new Date(max_date))
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      title: true,
      isCompleted: true,
      id: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: limit,
    skip: getPaginationSkip(page, limit),
    orderBy: getOrderBy(req.query),
  })

  if (tasks.length === 0) {
    return res.status(404).json({
      message: 'No tasks found.',
    })
  }

  const taskCount = await prisma.task.count({
    where: whereClause,
  })

  const pagination = paginate(req.query, taskCount)

  res.status(200).json({
    tasks,
    pagination,
  })
}

async function show(req, res, next) {
  const taskId = getTaskId(req)

  if (!taskId) return sendMissingTaskId(res)

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        User: {
          select: {
            name: true,
            email: true,
          }
        },
      },
    })

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
        userId: req.user.id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
        priority: true,
      }
    });

    res.status(200).json(task)
  } catch (err) {
    if (err.code === 'P2025' ) {
      return res.status(404).json({ message: 'The task was not found.'})
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
        userId: req.user.id,
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

async function bulkCreate(req, res, next) {
  const { tasks } = req.body

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      message: 'Invalid request data. Expected an array of tasks.',
    })
  }

  const validTasks = []
  try {
    tasks.forEach((task) => {
      const { error, value } = taskSchema.validate(task)

      if (error) throw error

      validTasks.push({
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: req.user.id,
      })
    })
  } catch (err) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.details,
    })
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    })

    res.status(201).json({
      message: 'success!',
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    })
  } catch (err) {
    return next(err)
  }
}

function getTaskId(req) {
  const taskId = req.params?.id

  if (!taskId) return

  return parseInt(taskId)
}

const getOrderBy = (query) => {
  const validSortFields = ['title', 'priority', 'createdAt', 'id', 'isCompleted']
  const sortBy = query.sortBy || 'createdAt'
  const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc'

  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection }
  }

  return { createdAt: 'desc' }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
}

const prisma = require('../db/prisma')
const {
  getPaginationQueryParams,
  paginate,
  getPaginationSkip,
} = require('../utilities/pagination')

async function show(req, res) {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({
      message: 'Invalid user ID',
    })
  }

  const taskStats = await prisma.task.groupBy({
    by: ['isCompleted'],
    where: { userId },
    _count: {
      id: true,
    },
  })

  const recentTasks = await prisma.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true,
      User: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const weeklyProgress = await prisma.task.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      createdAt: {
        gte: lastWeek,
      },
    },
    _count: { id: true }
  })

  res.status(200).json({
    taskStats,
    recentTasks,
    weeklyProgress,
  })
}

async function index(req, res) {
  const { page, limit } = getPaginationQueryParams(req.query)

  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: { isCompleted: false },
        select: { id: true },
        take: 5,
      },
      _count: {
        select: {
          Task: true,
        },
      },
    },
    skip: getPaginationSkip(page, limit),
    take: limit,
  })

  const users = usersRaw.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    _count: u._count,
    Task: u.Task,
  }))

  const totalUsers = await prisma.user.count()
  const pagination = paginate(req.query, totalUsers)

  res.status(200).json({
    users,
    pagination,
  })
}

async function search(req, res) {
  const { q } = req.params.q || ''
  const searchQuery = q.trim()

  if (searchQuery.length < 2) {
    return res.status(400).json({
      message: 'Search query must be at least 2 characters long',
    })
  }

  const { limit, page } = getPaginationQueryParams(req.query)
}

module.exports = {
  show,
  index,
  search,
}

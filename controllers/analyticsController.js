const prisma = require('../db/prisma')
const {
  getPaginationQueryParams,
  paginate,
  getPaginationSkip,
} = require('../utilities/pagination')

async function getUserAnalytics(req, res) {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({
      message: 'Invalid user ID',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
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

async function getUsersWithStats(req, res) {
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

async function searchTasks(req, res) {
  const q = req.query.q || ''
  const searchQuery = q.trim()

  if (searchQuery.length < 2) {
    return res.status(400).json({
      message: 'Search query must be at least 2 characters long',
    })
  }

  const { limit } = getPaginationQueryParams(req.query)

  const searchPattern = `%${searchQuery}%`
  const exactMatch = searchQuery
  const startsWith = `${searchQuery}%`

  const searchResults = await prisma.$queryRaw`
    SELECT
      t.id,
      t.title,
      t.is_completed as "isCompleted",
      t.priority,
      t.created_at as "createdAt",
      t.user_id as "userId",
      u.name as "user_name"
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.title ILIKE ${searchPattern}
       OR u.name ILIKE ${searchPattern}
    ORDER BY
      CASE
        WHEN t.title ILIKE ${exactMatch} THEN 1
        WHEN t.title ILIKE ${startsWith} THEN 2
        WHEN t.title ILIKE ${searchPattern} THEN 3
        ELSE 4
      END,
      t.created_at DESC
    LIMIT ${parseInt(limit)}
  `

  res.status(200).json({
    results: searchResults,
    query: searchQuery,
    count: searchResults.length,
  })
}

module.exports = {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
}

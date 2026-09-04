const express = require('express')
const prisma = require('./db/prisma')
const cookieParser = require('cookie-parser')

// Routes
const userRouter = require('./routes/userRoutes')
const taskRouter = require('./routes/taskRoutes')
const analyticsRouter = require('./routes/analyticsRoutes')

// Middleware
const notFoundHandler = require('./middleware/not-found')
const errorHandler = require('./middleware/error-handler')

const port = process.env.PORT || 3000

const app = express()
app.set('trust proxy', 1)
const helmet = require('helmet')
const rateLimiter = require('express-rate-limit')
const { xss } = require('express-xss-sanitizer')

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
)
app.use(helmet())
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(xss())

// Routes
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      db: 'not connected',
      error: err.message,
    })
  }
})
app.use('/api/users', userRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/analytics', analyticsRouter)

// Error-handling middlewares
app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  console.log('Prisma disconnected')

  server.close()
})

module.exports = { app, server }

const express = require('express')
const pool = require('./db/pg-pool')

// Routes
const userRouter = require('./routes/userRoutes')
const taskRouter = require('./routes/taskRoutes')

// Middleware
const authMiddleware = require('./middleware/auth')
const notFoundHandler = require('./middleware/not-found')
const errorHandler = require('./middleware/error-handler')

const port = process.env.PORT || 3000

const app = express()

function initializeGlobals() {
  global.user_id = null
}

initializeGlobals()

app.use(express.json())

// Routes
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ message: `db not connected: ${err.message}` })
  }
})
app.use('/api/users', userRouter)
app.use('/api/tasks', authMiddleware, taskRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

process.on('SIGTERM', async () => {
  await pool.end()
  server.close()
})

module.exports = { app, server }

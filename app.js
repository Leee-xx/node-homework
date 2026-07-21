const express = require('express')

// Routes
const userRouter = require('./routes/userRoutes')
// const taskRouter = require('./routes/taskRoutes')

// Middleware
const authMiddleware = require('./middleware/auth')
const notFoundHandler = require('./middleware/not-found')
const errorHandler = require('./middleware/error-handler')

const port = process.env.PORT || 3000

const app = express()

function initializeGlobals() {
  global.user_id = null
  global.users = []
  global.tasks = []
}

initializeGlobals()

app.use(express.json())

// Routes
app.use('/api/users', userRouter)
//app.use('/api/tasks', authMiddleware, taskRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

module.exports = { app, server }

const express = require('express')

const timeRouter = require('./routes/timeRoutes')
const userRouter = require('./routes/userRoutes')

const notFoundHandler = require('./middleware/not-found')
const errorHandler = require('./middleware/error-handler')

const port = process.env.PORT || 3000

const app = express()

function initalizeGlobals() {
  global.user_id = null
  global.users = []
  global.tasks = []
}

app.use(express.json())
app.use('/api', timeRouter)
app.use('/api/users', userRouter)

app.get('/', (req, res) => {
  res.send('Hello, World!')
})

app.post('/testpost', (req, res) => {
  res.status(200).json({
    message: 'POST route works',
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})

module.exports = { app, server }

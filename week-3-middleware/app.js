const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require('path')

const { randomUUID } = require('crypto')

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.
app.use((req, res, next) => {
  req.requestId = randomUUID()
  res.setHeader('X-Request-Id', req.requestId)
  next()
})
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString()
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`)
  next()
})
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')

  next()
})

app.use(express.json({ limit: '1mb' }))
app.use(
  express.static(path.join(__dirname, 'public'))
)

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json',
      requestId: req.requestId,
    })
  }

  next()
})

app.use("/", dogsRouter);// Do not remove this line

// Not found
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  })
})

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = status === 500 ? 'Internal Server Error' : err.message

  if (status >= 400 && status < 500) {
    console.warn(`WARN: ${err.name} - ${message}`)
  } else {
    console.error(`ERROR: ${err.name} - ${message}`)
  }

  res.status(status).json({
    error: message,
    requestId: req.requestId,
  })
})

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;


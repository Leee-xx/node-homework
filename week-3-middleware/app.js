const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require('path')

const { randomUUID } = require('crypto')

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.
app.use(express.json())
app.use(
  express.static(path.join(__dirname, 'public'))
)
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.requestId)
  next()
})
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString()
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`)
  next()
})

app.use("/", dogsRouter);// Do not remove this line

// Not found
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  })
  next()
})

app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.requestId,
  })
})

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;


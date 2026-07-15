function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`)
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`)
  }

  const errMessage = statusCode === 500 ?
    'Internal Server Error' :
    err.message

  res.status(statusCode).json({
    error: errMessage,
    requestId: req.requestId
  })
}

module.exports = errorHandler

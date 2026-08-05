function notFound(req, res) {
  res.status(404).json({
    message: 'Route not found',
    requestId: req.requestId,
  })
}

module.exports = notFound

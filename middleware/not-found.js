function notFound(req, res) {
  res.status(404).json({
    error: `No route matches ${req.method} ${req.path}`
  })
}

module.exports = notFound

function notFound(req, res) {
  res.status(404).json({
    message: `No route matches ${req.method} ${req.path}`
  })
}

module.exports = notFound

const jwt = require('jsonwebtoken')
const { StatusCodes } = require('http-status-codes')

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'No user is authenticated.' })
}

module.exports = (req, res, next) => {
  const token = req?.cookies?.jwt
  if (!token) {
    return send401(res)
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return send401(res)

    req.user = { id: decoded.id, }

    if (['POST', 'PATCH', 'DELETE', 'PUT', 'CONNECT']) {
      if (req.get('X-CSRF-TOKEN') !== decoded.csrfToken) {
        return send401(res)
      }
    }

    next()
  })
}

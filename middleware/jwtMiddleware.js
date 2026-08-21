const jwt = require('jsonwebtoken')
const { StatusCodes } = require('http-status-codes')

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'No user is authenticated.' })
}

module.exports = (req, res, next) => {
  console.log('jwt mw')
  const token = req?.cookies?.jwt
  if (!token) {
    console.log('no token found')
    return send401(res)
  }

  console.log(`verifying jwt: ${token}`)
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('error:', err)
      return send401(res)
    }

    req.user = { id: decoded.id, }

    if (['POST', 'PATCH', 'DELETE', 'PUT', 'CONNECT'].includes(req.method)) {
      console.log(`checking csrf header: ${req.get('X-CSRF-TOKEN')} !== ${decoded.csrfToken}`)
      if (req.get('X-CSRF-TOKEN') !== decoded.csrfToken) {
        return send401(res)
      }
    }

    next()
  })
}

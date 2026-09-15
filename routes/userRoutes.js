const express = require('express')
const {
  register,
  logon,
  googleLogon,
  show,
  logoff,
} = require('../controllers/userController')
const jwtMiddleware = require('../middleware/jwtMiddleware')

const router = express.Router()

router.get('/:id', show)
router.post('/register', register)
router.post('/googleLogon', googleLogon)
router.post('/logon', logon)

// Protected routes
router.use(jwtMiddleware)
router.post('/logoff', logoff)

module.exports = router

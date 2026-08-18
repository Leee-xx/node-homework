const express = require('express')
const {
  register,
  logon,
  show,
  logoff,
} = require('../controllers/userController')

const router = express.Router()

router.get('/:id', show)
router.post('/register', register)
router.post('/logon', logon)
router.post('/logoff', logoff)

module.exports = router

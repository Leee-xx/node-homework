const express = require('express')
const { register, logon, logoff } = require('../controllers/userController.json')

const router = express.Router()

router.post('/register', register)
router.post('/logon', logon)
router.post('/logoff', logoff)

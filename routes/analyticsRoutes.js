const express = require('express')
const { show, index } = require('../controllers/analyticsController')

const router = express.Router()

router.get('/users', index)
router.get('/users/:id', show)

module.exports = router

const express = require('express')
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require('../controllers/analyticsController')
const jwtMiddleware = require('../middleware/jwtMiddleware')

const router = express.Router()

router.use(jwtMiddleware)

router.get('/users', getUsersWithStats)
router.get('/users/:id', getUserAnalytics)
router.get('/tasks/search', searchTasks)

module.exports = router

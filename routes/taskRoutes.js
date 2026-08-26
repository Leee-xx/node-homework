const express = require('express')
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require('../controllers/taskController')
const jwtMiddleware = require('../middleware/jwtMiddleware')

const router = express.Router()

router.use(jwtMiddleware)

router.get('/', index)
router.post('/bulk', bulkCreate)
router.get('/:id', show)
router.post('/', create)
router.patch('/:id', update)
router.delete('/:id', deleteTask)

module.exports = router

const express = require('express')
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require('../controllers/taskController')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.post('/', create)
router.patch('/:id', update)
router.delete('/:id', deleteTask)
router.post('/bulk', bulkCreate)

module.exports = router

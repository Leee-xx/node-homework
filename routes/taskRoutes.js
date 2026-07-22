const express = require('express')
const { create, index, show, update, deleteTask } = require('../controllers/taskController')

const router = express.Router()

router.get('/', index)
router.get('/:taskId', show)
router.post('/', create)
router.patch('/:taskId', update)
router.delete('/:taskId', delete)

export.modules = router

const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getComments, createComment, deleteComment, updateComment } = require('../controllers/commentController')

const router = express.Router()

// Requiring auth for each post endpoint since every comment endpoint needs user information
router.use(requireAuth)

// GET single post's comments
router.get('/:id', getComments)

// POST a new comment
router.post('/:id', createComment)

// DELETE a comment/all post related comments
router.delete('/:id', deleteComment)

// UPDATE a comment
router.patch('/:id', updateComment)

module.exports = router
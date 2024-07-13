const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getRecentPosts, getSinglePost, createPost, deletePost, updatePost } = require('../controllers/postController')

const router = express.Router()

// Requiring auth for each post endpoint since every post endpoint needs user information
router.use(requireAuth)

// GET user posts
router.get('/', getRecentPosts)

// GET a single post
router.get('/:id', getSinglePost)

// POST a new post
router.post('/', createPost)

// DELETE a post
router.delete('/:id', deletePost)

// UPDATE a post
router.patch('/:id', updatePost)

module.exports = router
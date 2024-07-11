const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getRecentPosts, getSinglePost, createPost, deletePost, updatePost } = require('../controllers/postController')

const router = express.Router()

// Requiring auth for each post endpoint since every endpoint needs user information
router.use(requireAuth)

// GET user posts
router.get('/', getRecentPosts)

// GET a single post
router.get('/:id', getSinglePost)

// POST a new post
router.post('/', createPost)

// DELETE a post
router.get('/', deletePost)

// UPDATE a post
router.get('/', updatePost)

module.exports = router
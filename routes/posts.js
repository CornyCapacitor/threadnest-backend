const express = require('express')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// GET user posts
router.get('/', (req, res) => {
  res.status(200).send({ message: 'Getting all user posts' })
})

// GET a single post
router.get('/:id', (req, res) => {
  res.status(200).send({ message: 'Getting a user post' })
})

// POST a new post (authorization required)
router.post('/', requireAuth, (req, res) => {
  res.status(200).send({ message: 'Creating a new user post' })
})

// DELETE a post (authorization required)
router.get('/', requireAuth, (req, res) => {
  res.status(200).send({ message: 'Delete a user post' })
})

// UPDATE a post (authorization required)
router.get('/', requireAuth, (req, res) => {
  res.status(200).send({ message: 'Update a user post' })
})

module.exports = router
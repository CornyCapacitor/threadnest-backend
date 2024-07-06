const express = require('express')

const router = express.Router()

// GET user posts
router.get('/', (req, res) => {
  res.status(200).send({ message: 'Getting all user posts' })
})

// GET a single post
router.get('/:id', (req, res) => {
  res.status(200).send({ message: 'Getting a user post' })
})

// POST a new post
router.post('/', (req, res) => {
  res.status(200).send({ message: 'Creating a new user post' })
})

// DELETE a post
router.get('/', (req, res) => {
  res.status(200).send({ message: 'Delete a user post' })
})

// UPDATE a post
router.get('/', (req, res) => {
  res.status(200).send({ message: 'Update a user post' })
})

module.exports = router
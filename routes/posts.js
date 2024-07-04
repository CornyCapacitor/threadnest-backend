const express = require('express')

const router = express.Router()

// GET user posts
router.get('/', (request, response) => {
  response.status(200).send({ message: 'Getting all user posts' })
})

// GET a single post
router.get('/:id', (request, response) => {
  response.status(200).send({ message: 'Getting a user post' })
})

// POST a new post
router.post('/', (request, response) => {
  response.status(200).send({ message: 'Creating a new user post' })
})

// DELETE a post
router.get('/', (request, response) => {
  response.status(200).send({ message: 'Delete a user post' })
})

// UPDATE a post
router.get('/', (request, response) => {
  response.status(200).send({ message: 'Update a user post' })
})

module.exports = router
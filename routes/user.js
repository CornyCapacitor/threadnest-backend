const express = require('express')
const { getUsers, getUser, deleteUser, signupUser, loginUser } = require('../controllers/userController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// Get users route
router.get('/', getUsers)

// Get user route
router.get('/:id', getUser)

// Delete user route (authorization required)
router.delete('/:id', requireAuth, deleteUser)

// Login route
router.post('/login', loginUser)

// Signup route
router.post('/signup', signupUser)

module.exports = router
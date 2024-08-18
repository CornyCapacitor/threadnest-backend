const express = require('express')
const { getUsers, getUser, deleteUser, signupUser, loginUser, updateUser } = require('../controllers/userController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// Get users route
router.get('/', getUsers)

// Get user route
router.get('/:id', getUser)

// Delete user route (authorization required)
router.delete('/', requireAuth, deleteUser)

// Login route
router.post('/login', loginUser)

// Signup route
router.post('/signup', signupUser)

// Update user route (authorization required)
router.patch('/', requireAuth, updateUser)

module.exports = router
const express = require('express')
const { getUsers, getUser, deleteUser, signupUser, loginUser } = require('../controllers/userController')

const router = express.Router()

// Get users route
router.get('/', getUsers)

// Get user route
router.get('/:id', getUser)

// Delete user route
router.delete('/:id', deleteUser)

// Login route
router.post('/login', loginUser)

// Signup route
router.post('/signup', signupUser)

module.exports = router
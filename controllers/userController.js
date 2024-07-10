const mongoose = require('mongoose')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// Token creation
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

// GET all users
// Example: /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()

    // Not sure if I should do this check due to try/catch block being here already
    if (!users.length) {
      res.status(404).send({ error: 'No users found' })
    }

    // Sending back the response
    res.status(200).send(users)
  } catch (error) {
    // Sending back the error
    res.status(400).send({ error: error.message })
  }
}

// Get user
// Example: /api/users/668da2a8e36c3baeff482a9f
const getUser = async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findOne({ _id: id })

    // Not sure if I should do this check due to try/catch block being here already
    if (!user) {
      res.status(404).send({ error: 'No user found' })
    }

    // Sending back the response
    res.status(200).send(user)
  } catch (error) {
    // Sending back the error
    res.status(400).send({ error: error.message })
  }
}

// DELETE user
// Example: /api/users/delete/668d9b89f9494d0b032ad7b3
const deleteUser = async (req, res) => {
  const { id } = req.params

  try {
    // Checking if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    const deleteUser = await User.findOneAndDelete({ _id: id })

    // Checking if user exists
    if (!deleteUser) {
      return res.status(404).send({ error: 'User not found' })
    }

    // Sending back the response
    res.status(200).send(deleteUser)
  } catch (error) {
    // Sending back the error
    res.status(400).json({ error: error.message })
  }
}

// POST new user
// Example: /api/users/signup
const signupUser = async (req, res) => {
  const { email, password, username } = req.body

  try {
    // Signing in new user
    const user = await User.signup(email, password, username)

    // Create a JWT
    const token = createToken(user._id)

    // Sending back the response
    res.status(200).json({ email, token })
  } catch (err) {
    // Sending back the error
    res.status(400).json({ error: err.message })
  }
}

// POST existing user
// Example: /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Logging in the user
    const user = await User.login(email, password)

    // Create a JWT
    const token = createToken(user._id)

    // Sending back the response
    res.status(200).send({ email, token })
  } catch (error) {
    // Sending back the error
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getUsers,
  getUser,
  deleteUser,
  loginUser,
  signupUser
}
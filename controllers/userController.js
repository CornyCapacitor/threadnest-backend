const mongoose = require('mongoose')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

// Token creation
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '1h' })
}

// POST new user
// Example: /api/users/
const signupUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Signing in new user
    const user = await User.signup(email, password)

    // Create a JWT
    const token = createToken(user._id)

    // Sending back the response
    res.status(200).json({ email, token })
  } catch (err) {
    // Sending back the error
    res.status(400).json({ error: err.message })
  }
}

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
  loginUser,
  signupUser
}
const mongoose = require('mongoose')
const User = require('../models/userModel')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// Token creation
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '1h' })
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

// GET user
// Example: /api/users/668da2a8e36c3baeff482a9f
const getUser = async (req, res) => {
  const { id } = req.params

  try {
    // Check if ID of a user is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid user ID' })
    }

    const user = await User.findOne({ _id: id })

    // Check if user was found
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
  const userId = req.user._id

  try {
    // Check if ID of a user is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid user ID' })
    }

    // Check if authorized user and params user are equal (!= is intentional)
    if (id != userId) {
      return res.status(404).send({ error: 'Logged user does not match user in params' })
    }

    const deleteUser = await User.findOneAndDelete({ _id: userId })

    // Check if user exists
    if (!deleteUser) {
      return res.status(404).send({ error: 'User not found' })
    }

    // Deleting user related posts
    const deleteUserPosts = await Post.deleteMany({ author_id: id })

    // Deleting user related comments
    const deleteUserComments = await Comment.deleteMany({ author_id: id })

    // Removing unnecessary information from response
    const responseUser = {
      _id: deleteUser._id,
      email: deleteUser.email,
      username: deleteUser.username,
    }

    // Constructing response
    const response = {
      message: `User ${deleteUser.username} with id ${deleteUser._id} and his related posts/comments have been deleted succesfully`,
      user: responseUser,
      postsDeleted: deleteUserPosts.deletedCount,
      commentsDeleted: deleteUserComments.deletedCount
    }

    // Sending back the response
    res.status(200).send(response)
  } catch (error) {
    // Sending back the error
    res.status(400).send({ error: error.message })
  }
}

// PATCH existing user
// Example: /api/users/668d9b89f9494d0b032ad7b3
const updateUser = async (req, res) => {
  const { id } = req.params
  const { username } = req.body
  const userId = req.user._id

  try {
    // Check if there's username inside given body
    if (!username) {
      return res.status(400).send({ error: 'Username is required for patch' })
    }

    // Check if ID of a user is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid user ID' })
    }

    // Check if authorized user and params user are equal (!= is intentional)
    if (id != userId) {
      return res.status(404).send({ error: 'Logged user does not match user in params' })
    }

    // Updating the user in database
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { username: username } },
      { new: true }
    )

    // Check if update was succesfull
    if (!updatedUser) {
      return res.status(404).send({ error: 'User not found' })
    }

    // Sending back the response
    res.status(200).send({ message: `Updated user: ${updatedUser}` })
  } catch (error) {
    // Sending back the error
    res.status(400).send({ error: error.message })
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
    res.status(200).send({ email, token, username: user.username })
  } catch (err) {
    // Sending back the error
    res.status(400).send({ error: err.message })
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
    res.status(200).send({ email, token, username: user.username })
  } catch (error) {
    // Sending back the error
    res.status(400).send({ error: error.message })
  }
}

module.exports = {
  getUsers,
  getUser,
  deleteUser,
  loginUser,
  signupUser,
  updateUser
}
const mongoose = require('mongoose')
const User = require('../models/userModel')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const bcrypt = require('bcrypt')
require('dotenv').config()

// Token creation
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// GET all users
// Example: /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id username email')

    if (!users.length) {
      return res.status(404).send({ error: 'No users found' })
    }

    return res.status(200).send(users)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// GET user
// Example: /api/users/668da2a8e36c3baeff482a9f
const getUser = async (req, res) => {
  const { id } = req.params

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid user ID' })
    }

    const user = await User.findOne({ _id: id })

    if (!user) {
      return res.status(404).send({ error: 'User not found' })
    }

    return res.status(200).send(user)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// DELETE user
// Example: /api/users/delete
const deleteUser = async (req, res) => {
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: 'Invalid user ID' })
    }

    const deleteUser = await User.findOneAndDelete({ _id: userId })

    if (!deleteUser) {
      return res.status(404).send({ error: 'User not found' })
    }

    const deleteUserPosts = await Post.deleteMany({ author_id: userId })

    const deleteUserComments = await Comment.deleteMany({ author_id: userId })

    const responseUser = {
      _id: deleteUser._id,
      email: deleteUser.email,
      username: deleteUser.username,
    }

    const response = {
      message: `User ${deleteUser.username} with id ${deleteUser._id} and his related posts/comments have been deleted succesfully`,
      user: responseUser,
      postsDeleted: deleteUserPosts.deletedCount,
      commentsDeleted: deleteUserComments.deletedCount
    }

    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// PATCH existing user
// Example: /api/users?action=username
const updateUser = async (req, res) => {
  const { username } = req.body
  const { password } = req.body
  const userId = req.user._id
  const action = req.query.action

  try {
    switch (action) {
      case 'username':
        if (!username) {
          return res.status(400).send({ error: 'Username is required for patch' })
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).send({ error: 'Invalid user ID' })
        }

        if (!userId) {
          return res.status(401).send({ error: 'Failed to set user after an authentication' })
        }

        const duplicate = await User.findOne({ username: username })

        if (duplicate) {
          return res.status(400).send({ error: 'Username already exists' })
        }

        const updatedUsername = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { username: username } },
          { new: true, runValidators: true }
        )

        if (!updatedUsername) {
          return res.status(404).send({ error: 'User not found' })
        }

        return res.status(200).send(updatedUsername)

      case 'password':
        if (!password) {
          return res.status(400).send({ error: 'Password is required for patch ' })
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).send({ error: 'Invalid user ID' })
        }

        if (!userId) {
          return res.status(401).send({ error: 'Failed to set user after an authentication' })
        }

        if (!validator.isStrongPassword(password)) {
          return res.status(400).send({ error: 'Password not strong enough' })
        }

        const saltRounds = 10
        const salt = await bcrypt.genSalt(saltRounds)
        const hashedPassword = await bcrypt.hash(password, salt)

        const updatedPassword = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { password: hashedPassword } },
          { new: true, runValidators: true }
        )

        if (!updatedPassword) {
          return res.status(404).send({ error: 'User not found' })
        }

        return res.status(200).send(updatedPassword)
      default:
        return res.status(400).send({ error: 'Invalid action' })
    }

  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// POST new user
// Example: /api/users/signup
const signupUser = async (req, res) => {
  const { email, password, username } = req.body

  try {
    const user = await User.signup(email, password, username)

    const token = createToken(user._id)

    return res.status(201).send({ email, token, username: user.username })
  } catch (err) {
    return res.status(500).send({ error: err.message })
  }
}

// POST existing user
// Example: /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.login(email, password)

    const token = createToken(user._id)

    return res.status(200).send({ email, token, username: user.username })
  } catch (error) {
    return res.status(500).send({ error: error.message })
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
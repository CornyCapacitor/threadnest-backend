const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
require('dotenv')

// Verifying if user is authorized
const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers

  // Check if there's auth information inside headers
  if (!authorization) {
    return res.status(401).send({ error: 'Authorization token required' })
  }

  // Extracting token from the headers
  const token = authorization.split(' ')[1]

  try {
    // Verifying the token
    const { _id } = jwt.verify(token, process.env.JWT_SECRET)

    // Setting request value 'user' that contains the user id
    req.user = await User.findOne({ _id }).select('_id')

    if (!req.user) {
      return res.status(401).send({ error: 'User not found' })
    }

    // Moving on to another middleware/endpoint
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ error: `${error}` })
    }

    // General authorization error
    res.status(401).send({ error: 'Request is not authorized' })
  }
}

module.exports = requireAuth
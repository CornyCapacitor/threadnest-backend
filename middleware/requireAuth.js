const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
require('dotenv')

// Verifying if user is authorized
const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers

  // Checking if there's auth information inside headers
  if (!authorization) {
    return res.status(401).send({ error: 'Authorization token required' })
  }

  console.log(authorization)

  // Extracting token from the headers
  const token = authorization.split(' ')[1]

  try {
    // Verifying the token
    const { _id } = jwt.verify(token, process.env.SECRET)

    // Setting request value 'user' that contains the user id
    req.user = await User.findOne({ _id }).select('_id')

    // Moving on to another middleware/endpoint
    next()
  } catch (error) {
    // Sending back the rror
    console.log(error)
    res.status(401).send({ error: 'Request is not authorized' })
  }
}
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
require('dotenv')

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).send({ error: 'Authorization token required' })
  }

  const token = authorization.split(' ')[1]

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await User.findOne({ _id }).select('_id')

    if (!req.user) {
      return res.status(401).send({ error: 'User not found' })
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ error: `${error}` })
    }

    res.status(401).send({ error: 'Request is not authorized' })
  }
}

module.exports = requireAuth
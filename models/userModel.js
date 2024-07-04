const mongoose = require('mongoose')
mongoose.set('StrictQuery', true)

const Schema = mongoose.Schema

const emailRegex = /^(?=.{1,256})(?=.{1,64}@.{1,255})(?!.*\.\.)(?!^\.)(?!.*\.$)(?!.*@\.$)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required.'],
    unique: [true, 'Username must be unique.'],
    minlength: [3, 'Username must be at least 3 characters long.'],
    maxlength: [30, 'Username cannot exceed 30 characters.']
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: [true, 'Email must be unique.'],
    match: [emailRegex, 'Please enter a valid email address.']
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.']
  },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
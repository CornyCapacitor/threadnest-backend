const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
mongoose.set('strictQuery', true)

const Schema = mongoose.Schema

const emailRegex = /^(?=.{1,256})(?=.{1,64}@.{1,255})(?!.*\.\.)(?!^\.)(?!.*\.$)(?!.*@\.$)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: [true, 'Username must be unique'],
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: [true, 'Email must be unique'],
    match: [emailRegex, 'Please enter a valid email address.']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
}, { timestamps: true })

// Static signup method
userSchema.statics.signup = async function (email, password, username) {
  if (!email || !password || !username) {
    throw Error('All fields are required')
  }

  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }

  const duplicate = await this.findOne({ email: email.toLowerCase() })

  if (duplicate) {
    throw Error('Email already in use')
  }

  const saltRounds = 10
  const salt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(password, salt)

  const user = await this.create({ email: email.toLowerCase(), password: hashedPassword, username })

  return user
}

// Static login method
userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error('All fields are required')
  }

  const user = await this.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw Error('Incorrect email')
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    throw Error('Incorrect password')
  }

  return user
}

module.exports = mongoose.model('User', userSchema)
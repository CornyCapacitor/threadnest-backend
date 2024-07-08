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

// Static signup method
userSchema.statics.signup = async function (email, password, username) {
  // Validation
  if (!email || !password) {
    throw Error('All fields are required')
  }

  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough')
  }

  // Checking for duplicate
  const duplicate = await this.findOne({ email })

  if (duplicate) {
    throw Error('Email already in use')
  }

  // Constructing hash password
  const saltRounds = 10
  const salt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Creating new user in database
  const user = await this.create({ email, password: hashedPassword, username })

  return user
}

// Static login method
userSchema.statics.login = async function (email, password) {
  // Validation
  if (!email || !password) {
    throw Error('All fields are required')
  }

  // Checking if user exists
  const user = await this.findOne({ email })

  if (!user) {
    throw Error('Incorrect email')
  }

  // Checking password integrity
  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    throw Error('Incorrect password')
  }

  return user
}

module.exports = mongoose.model('User', userSchema)
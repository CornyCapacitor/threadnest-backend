const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt')

describe('GET /api/users/:id', () => {
  let userId

  // Creating new user before testing
  before(async () => {
    // Make sure there's no such user in database
    await User.deleteMany({ username: 'Test User' })

    const user = new User({
      username: 'Test User',
      email: 'testuser@example.com',
      password: 'password123'
    })
    const savedUser = await user.save()
    userId = savedUser._id
  })

  // Deleting the user after testing is done
  after(async () => {
    await User.findOneAndDelete({ _id: userId })
  })

  // Tests
  it('should return user details', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200)

    expect(res.body).to.have.property('_id', userId.toString())
    expect(res.body).to.have.property('username', 'Test User')
    expect(res.body).to.have.property('email', 'testuser@example.com')
  })

  it('should return 404 for wrong id', async () => {
    const wrongId = '6694153ac85c'
    const res = await request(app)
      .get(`/api/users/${wrongId}`)

    expect(res.body).to.have.property('error', 'Invalid user ID')
  })

  it('should return 404 for non-existing user', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .get(`/api/users/${nonExistingId}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'User not found')
  })
})

describe('POST /api/users/signup', () => {
  let userId

  beforeEach(async () => {
    // Make sure there's no such user in database
    await User.deleteMany({ username: 'Signup User' })
  })

  // Deleting the user after testing is done
  afterEach(async () => {
    await User.deleteMany({ _id: userId })
  })

  it('should return succesfully signed up user details', async () => {
    const userData = {
      email: 'testsignup@example.com',
      password: 'Password123!',
      username: 'Signup User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    expect(res.body).to.have.property('email', userData.email)
    expect(res.body).to.have.property('username', userData.username)
    expect(res.body).to.have.property('token').that.is.a('string')

    const user = await User.findOne({ email: res.body.email, username: res.body.username })
    userId = user._id

    const isMatch = await bcrypt.compare(userData.password, user.password)

    expect(user).to.not.be.null
    expect(user.username).to.equal(userData.username)
    expect(user.email).to.equal(userData.email)
    expect(isMatch).to.be.true;
  })

  it('should return 500 for missing body', async () => {
    const res = await request(app)
      .post('/api/users/signup')
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for missing username', async () => {
    const userData = {
      email: 'testsignup@example.com',
      password: 'Password123!'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for missing email', async () => {
    const userData = {
      username: 'Test Signup',
      password: 'Password123!'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for missing password', async () => {
    const userData = {
      email: 'testsignup@example.com',
      username: 'Test Signup'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for invalid email', async () => {
    const wrongEmailData = {
      email: 'wrongEmail@example',
      password: 'Wrongemail123!',
      username: 'Wrong Email'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(wrongEmailData)
      .expect(500)

    expect(res.body).to.have.property('error', 'Email is not valid')
  })

  it('should return 500 for weak password', async () => {
    const weakPasswordData = {
      email: 'weakPassword@example.com',
      password: 'weakpassword',
      username: 'Weak Password'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(weakPasswordData)
      .expect(500)

    expect(res.body).to.have.property('error', 'Password not strong enough')
  })

  it('should return 500 for too short username', async () => {
    const userData = {
      email: 'testsignup@example.com',
      password: 'Password123!',
      username: 'Ex'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'User validation failed: username: Username must be at least 3 characters long')
  })

  it('should return 500 for too long username', async () => {
    const userData = {
      email: 'testsignup@example.com',
      password: 'Password123!',
      username: 'Superlongusernamethatshouldntbeallowed'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'User validation failed: username: Username cannot exceed 30 characters')
  })

  it('should return 500 when email is already in use', async () => {
    const userData = {
      email: 'testsignup@example.com',
      password: 'Password123!',
      username: 'Signup User'
    }

    const firstRes = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ email: userData.email })

    userId = user._id

    const secondRes = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(500)

    expect(secondRes.body).to.have.property('error', 'Email already in use')
  })
})
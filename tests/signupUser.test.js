const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const bcrypt = require('bcrypt')

describe('POST /api/users/signup', () => {
  let userId

  beforeEach(async () => {
    // Make sure there's no such user in database before each test
    await User.deleteMany({ username: 'Signup User' })
  })

  // Deleting the user after test is done
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

    expect(user).to.not.be.null
    expect(user.username).to.equal(userData.username)
    expect(user.email).to.equal(userData.email)

    const isMatch = await bcrypt.compare(userData.password, user.password)

    expect(isMatch).to.be.true
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
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv')

describe('POST /api/users/login', () => {
  let userId

  beforeEach(async () => {
    await User.deleteMany({ username: 'Login User' })

    const userData = {
      email: 'testlogin@example.com',
      password: 'Password123!',
      username: 'Login User'
    }

    await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Login User', email: 'testlogin@example.com' })

    if (user) {
      userId = user._id
    }
  })

  afterEach(async () => {
    await User.deleteMany({ username: 'Login User' })
  })

  it('should return succesfully logged in user details', async () => {
    const userData = {
      email: 'testlogin@example.com',
      password: 'Password123!',
    }

    const res = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(200)

    expect(res.body).to.have.property('email', userData.email)
    expect(res.body).to.have.property('token').that.is.a('string')

    const user = await User.findOne({ email: userData.email })

    expect(user).to.not.be.null
    expect(user._id.toString()).to.equal(userId.toString())
    expect(user.email).to.equal(userData.email)
    expect(user.username).to.equal(res.body.username)

    const token = res.body.token

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    expect(decodedToken).to.have.property('_id', userId.toString())

    const isMatch = await bcrypt.compare(userData.password, user.password)

    expect(isMatch).to.be.true
  })

  it('should return 500 if no empty body', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for no email attached', async () => {
    const userData = {
      password: 'Password123!'
    }

    const res = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 for no password attached', async () => {
    const userData = {
      email: 'testlogin@example.com'
    }

    const res = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'All fields are required')
  })

  it('should return 500 when cannot find user with given email', async () => {
    const userData = {
      email: 'nofounduser@example.com',
      password: 'Password123!'
    }

    const res = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'Incorrect email')
  })

  it('should return 500 when wrong password is given', async () => {
    const userData = {
      email: 'testlogin@example.com',
      password: 'Incorrectpassword123!',
    }

    const res = await request(app)
      .post('/api/users/login')
      .send(userData)
      .expect(500)

    expect(res.body).to.have.property('error', 'Incorrect password')
  })
})
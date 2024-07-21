const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken')
require('dotenv')

// Token creation
const createShortToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '1s' })
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('requireAuth middleware', () => {
  let token
  let userId

  beforeEach(async () => {
    await User.deleteMany({ username: 'Authorized User' })

    const userData = {
      email: 'authorizeduser@example.com',
      password: 'Password123!',
      username: 'Authorized User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Authorized User', email: 'authorizeduser@example.com' })

    if (user) {
      token = res.body.token
      userId = user._id
    }
  })

  afterEach(async () => {
    await User.deleteMany({ username: 'Authorized User' })
  })

  it('should pass the authorization and get posts if token is valid', async () => {
    await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const { _id } = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findOne({ username: 'Authorized User' })

    expect(_id.toString()).to.equal(user._id.toString())
  })

  it('should return 401 when valid token but not user found', async () => {
    await User.deleteMany({ username: 'Authorized User' })

    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(401)

    expect(res.body).to.have.property('error', 'User not found')
  })

  it('should return 401 when token is expired', async () => {
    const shortToken = createShortToken(userId)
    await sleep(1200)

    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${shortToken}`)
      .expect(401)

    expect(res.body).to.have.property('error', 'TokenExpiredError: jwt expired')
  })

  it('should return 401 when no authorization token given', async () => {
    const res = await request(app)
      .get('/api/posts')
      .expect(401)

    expect(res.body).to.have.property('error', 'Authorization token required')
  })

  it('should return 401 when empty token is invalid', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401)

    expect(res.body).to.have.property('error', 'Request is not authorized')
  })
})
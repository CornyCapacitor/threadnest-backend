const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')

describe('PATCH /api/users/:id', () => {
  let userId
  let token

  beforeEach(async () => {
    await User.deleteMany({ username: 'Update User' })

    const userData = {
      email: 'updateuser@example.com',
      password: 'Password123!',
      username: 'Update User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Update User', email: 'updateuser@example.com' })

    if (user) {
      userId = user._id
      token = res.body.token
    }
  })

  afterEach(async () => {
    await User.deleteMany({ _id: userId, email: 'updateuser@example.com' })
  })

  it('should succesfully update user when user in params matches user in headers', async () => {
    const userData = {
      username: 'New username'
    }

    const res = await request(app)
      .patch(`/api/users/${userId}`)
      .send(userData)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.have.property('_id', userId.toString())
    expect(res.body).to.have.property('username', userData.username)

    const user = await User.findOne({ _id: userId })
    expect(user.username).to.be.equal(userData.username)
  })

  it('should return 400 for not username given', async () => {
    const res = await request(app)
      .patch(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Username is required for patch')
  })

  it('should return 400 for invalid user id', async () => {
    const userData = {
      username: 'New username'
    }

    const invalidId = uuidv4()

    const res = await request(app)
      .patch(`/api/users/${invalidId}`)
      .send(userData)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid user ID')
  })

  it('should return 401 when user in params doess not match user in headers', async () => {
    const userData = {
      username: 'New username'
    }

    const invalidId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .patch(`/api/users/${invalidId}`)
      .send(userData)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)

    expect(res.body).to.have.property('error', 'Logged user does not match user in params')
  })

  it('should return 500 for wrong username', async () => {
    const userData1 = {
      username: 'A'
    }

    const res1 = await request(app)
      .patch(`/api/users/${userId}`)
      .send(userData1)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(res1.body).to.have.property('error', 'Validation failed: username: Username must be at least 3 characters long')

    const userData2 = {
      username: 'A pretty long username that should not be available to patch'
    }

    const res2 = await request(app)
      .patch(`/api/users/${userId}`)
      .send(userData2)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(res2.body).to.have.property('error', 'Validation failed: username: Username cannot exceed 30 characters')
  })
})
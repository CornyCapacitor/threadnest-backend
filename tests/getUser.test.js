const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/userModel');

describe('GET /api/users/:id', () => {
  let userId

  // Creating new user before testing
  beforeEach(async () => {
    // Make sure there's no such user in database before each test
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
  afterEach(async () => {
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
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
require('dotenv')

describe('GET /api/posts', () => {
  let token
  let userId
  let testPostId

  before(async () => {
    await User.deleteMany({ username: 'Get Posts User' })

    const userData = {
      email: 'getpostsuser@example.com',
      password: 'Password123!',
      username: 'Get Posts User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Get Posts User', email: 'getpostsuser@example.com' })

    if (user) {
      userId = user._id
      token = res.body.token
    }
  })

  beforeEach(async () => {
    await Post.deleteMany({ author_id: userId })

    const post = new Post({
      author_id: userId,
      title: 'Test post',
      content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
    })

    await post.save()

    const createdPost = await Post.findOne({ author_id: userId, title: 'Test post' })

    if (createdPost) {
      testPostId = createdPost._id
    }
  })

  afterEach(async () => {
    await Post.deleteMany({ author_id: userId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Get Posts User' })
  })

  it('should play test setup properly', async () => {
    const user = await User.findOne({ _id: userId })

    expect(user.username).to.be.equal('Get Posts User')

    const post = await Post.findOne({ _id: testPostId })

    expect(post.title).to.be.equal('Test post')
  })

  it('should get 20 latest posts', async () => {
    const postPromises = []
    for (let i = 0; i < 20; i++) {
      const post = new Post({
        author_id: userId,
        title: `Test post ${i + 1}`,
        content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
      })
      postPromises.push(post.save())
    }

    await Promise.all(postPromises)

    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.be.an('array')
    expect(res.body).to.have.lengthOf(20)

    res.body.forEach(post => {
      expect(post.author_id).to.be.equal(userId.toString())
    })
  })
})
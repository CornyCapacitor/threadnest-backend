const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
require('dotenv')

describe('GET /api/posts/:id', () => {
  let token
  let userId
  let testPostId

  before(async () => {
    await User.deleteMany({ username: 'Get Post User' })

    const userData = {
      email: 'getpostuser@example.com',
      password: 'Password123!',
      username: 'Get Post User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Get Post User', email: 'getpostuser@example.com' })

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
    await User.deleteMany({ username: 'Get Post User' })
  })

  it('should properly fetch post', async () => {
    const res = await request(app)
      .get(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.deep.equal({
      _id: testPostId.toString(),
      author_id: userId.toString(),
      title: 'Test post',
      content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.',
      upvotesCount: 0,
      commentsCount: 0,
      upvoted: false
    });
  })

  it('should return 400 when invalid post id queried', async () => {
    const invalidId = uuidv4()

    const res = await request(app)
      .get(`/api/posts/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid post ID')
  })

  it('should return 404 when no post found', async () => {
    const invalidId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .get(`/api/posts/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })
})
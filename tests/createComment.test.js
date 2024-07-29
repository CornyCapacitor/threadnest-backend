const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
require('dotenv')

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

describe('POST /api/posts/:id', function () {
  let token
  let userId
  let testPostId

  before(async () => {
    await User.deleteMany({ username: 'Update Post User' })
    await Post.deleteMany({ author_id: userId })

    const userData = {
      email: 'updatepostuser@example.com',
      password: 'Password123!',
      username: 'Update Post User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Update Post User', email: 'updatepostuser@example.com' })

    if (user) {
      userId = user._id
      token = res.body.token
    }

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

  beforeEach(async () => {
    await Comment.deleteMany({ author_id: userId, post_id: testPostId })
  })

  afterEach(async () => {
    await Comment.deleteMany({ author_id: userId, post_id: testPostId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Update Post User' })
    await Post.deleteMany({ author_id: userId })
  })

  it('should succesfully create a new comment', async () => {
    const comment = {
      content: 'Test comment'
    }

    const res = await request(app)
      .post(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(comment)
      .expect(201)

    console.log(res.body)

    expect(res.body).to.deep.include({
      author_id: userId.toString(),
      post_id: testPostId.toString(),
      content: comment.content,
      upvotes: []
    })
  })

  it('should return 400 for invalid id', async () => {
    const invalidId = uuidv4()

    const comment = {
      content: 'Test comment'
    }

    const res = await request(app)
      .post(`/api/comments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(comment)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid post ID')
  })

  it('should return 400 for no content attached', async () => {
    const res = await request(app)
      .post(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Content is required')
  })

  it('should return 404 for no post found', async () => {
    const invalidId = new mongoose.Types.ObjectId()

    const comment = {
      content: 'Test comment'
    }

    const res = await request(app)
      .post(`/api/comments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(comment)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })

  it('should return 500 if comment exceeds 500 characters', async () => {
    const comment = {
      content: generateRandomString(501)
    }

    const res = await request(app)
      .post(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(comment)
      .expect(500)

    expect(res.body).to.have.property('error', 'Comment validation failed: content: Comment cannot exceed 500 characters')
  })
})

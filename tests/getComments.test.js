const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')

describe('PATCH /api/posts/:id', function () {
  let token
  let userId
  let testPostId
  let comment1Id
  let comment2Id

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

    const comment1 = new Comment({
      author_id: userId,
      content: 'Test comment 1',
      post_id: testPostId
    })

    await comment1.save()

    const comment2 = new Comment({
      author_id: userId,
      content: 'Test comment 2',
      post_id: testPostId
    })

    await comment2.save()

    const createdComments = await Comment.find({ author_id: userId, post_id: testPostId })

    if (createdComments) {
      comment1Id = createdComments[0]._id
      comment2Id = createdComments[1]._id
    }
  })

  afterEach(async () => {
    await Comment.deleteMany({ author_id: userId, post_id: testPostId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Update Post User' })
    await Post.deleteMany({ author_id: userId })
  })

  it('should succesfully fetch post comments', async () => {
    const res = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.have.lengthOf(2)
    expect(res.body[0]).to.have.property('_id', comment1Id.toString())
    expect(res.body[1]).to.have.property('_id', comment2Id.toString())
  })

  it('should return 400 for invalid id', async () => {
    const invalidId = uuidv4()

    const res = await request(app)
      .get(`/api/comments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid post ID')
  })

  it('should return 404 for no post found', async () => {
    const otherPostId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .get(`/api/comments/${otherPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })

  it('should return 404 for no comments found', async () => {
    await Comment.deleteMany({ author_id: userId, post_id: testPostId })

    const res = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'No comments found')
  })
})

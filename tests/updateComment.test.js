const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

describe('UPDATE /api/comments/:id', async () => {
  let token
  let userId
  let testPostId
  let commentId

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

    const comment = new Comment({
      author_id: userId,
      content: 'Test post content',
      post_id: testPostId
    })

    await comment.save()

    if (comment) {
      commentId = comment._id
    }
  })

  afterEach(async () => {
    await Comment.deleteMany({ author_id: userId, post_id: testPostId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Update Post User' })
    await Post.deleteMany({ author_id: userId })
  })

  it('should succesfully update comment content (update action)', async () => {
    const commentData = {
      content: 'Updated content'
    }

    const action = 'update'

    const res1 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res1.body).to.be.an('array')
    expect(res1.body).to.have.lengthOf(1)
    expect(res1.body[0]).to.deep.include({
      post_id: testPostId.toString(),
      author_id: userId.toString(),
      content: 'Test post content'
    })

    const res2 = await request(app)
      .patch(`/api/comments/${commentId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(commentData)
      .expect(200)

    expect(res2.body).to.deep.include({
      _id: commentId.toString(),
      author_id: userId.toString(),
      post_id: testPostId.toString(),
      content: 'Updated content',
      upvotes: []
    })

    const res3 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res3.body).to.be.an('array')
    expect(res3.body).to.have.lengthOf(1)
    expect(res3.body[0]).to.deep.include({
      post_id: testPostId.toString(),
      author_id: userId.toString(),
      content: 'Updated content'
    })
  })

  it('should succesfully upvote/downvote comment (upvote action)', async () => {
    const action = 'upvote'

    const res1 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res1.body[0].upvotesCount).to.be.equal(0)

    const res2 = await request(app)
      .patch(`/api/comments/${commentId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res2.body.upvotes).to.include(userId.toString())

    const res3 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res3.body[0].upvotesCount).to.be.equal(1)

    const res4 = await request(app)
      .patch(`/api/comments/${commentId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res4.body.upvotes).to.not.include(userId.toString())

    const res5 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res5.body[0].upvotesCount).to.be.equal(0)
  })

  it('should return 400 for invalid comment id', async () => {
    const invalidId = uuidv4()

    let action = 'update'

    const res1 = await request(app)
      .patch(`/api/comments/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res1.body).to.have.property('error', 'Invalid comment ID')

    action = 'upvote'

    const res2 = await request(app)
      .patch(`/api/comments/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res2.body).to.have.property('error', 'Invalid comment ID')
  })

  it('should return 400 for no content attached (update action)', async () => {
    const action = 'update'

    const res = await request(app)
      .patch(`/api/comments/${commentId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Content is required for patch')
  })

  it('should return 404 for no comment found', async () => {
    const invalidId = new mongoose.Types.ObjectId()

    let action = 'update'

    const updateValue = {
      content: 'Updated content'
    }

    const res1 = await request(app)
      .patch(`/api/comments/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateValue)
      .expect(404)

    expect(res1.body).to.have.property('error', 'Comment not found')

    action = 'upvote'

    const res2 = await request(app)
      .patch(`/api/comments/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res2.body).to.have.property('error', 'Comment not found')
  })

  it('should return 500 for invalid content length', async () => {
    const action = 'update'

    const updateValue = {
      content: generateRandomString(501)
    }

    const res = await request(app)
      .patch(`/api/comments/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateValue)
      .expect(500)

    expect(res.body).to.have.property('error', 'Validation failed: content: Comment cannot exceed 500 characters')
  })

  it('should return 400 for invalid action', async () => {
    const action = generateRandomString(10)

    const res1 = await request(app)
      .patch(`/api/comments/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res1.body).to.have.property('error', 'Invalid action')

    const res2 = await request(app)
      .patch(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res2.body).to.have.property('error', 'Invalid action')
  })
})
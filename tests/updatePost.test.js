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

describe('PATCH /api/posts/:id', function () {
  this.timeout(10000)
  let token
  let userId
  let testPostId
  let action

  before(async () => {
    await User.deleteMany({ username: 'Update Post User' })

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
    await User.deleteMany({ username: 'Update Post User' })
  })

  it('should succesfully update post details (update action)', async () => {
    const newContent = {
      title: 'New Post Title',
      content: 'New post example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
    }

    action = 'update'

    const res = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(newContent)
      .expect(200)

    expect(res.body).to.deep.include({
      author_id: userId.toString(),
      _id: testPostId.toString(),
      title: newContent.title,
      content: newContent.content
    })
  })

  it('should succesfully upvote/downvote the post (upvote action)', async () => {
    action = 'upvote'

    const res1 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res1.body.upvotes).to.deep.include(userId.toString())

    const updatedPostAfterUpvote = await Post.findById(testPostId)
    expect(updatedPostAfterUpvote.upvotes).to.include(userId.toString())

    const res2 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res2.body.upvotes).to.not.include(userId.toString());

    const updatedPostAfterDownvote = await Post.findById(testPostId);
    expect(updatedPostAfterDownvote.upvotes).to.not.include(userId);
  })

  it('should return 400 for invalid post id', async () => {
    const invalidId = uuidv4()

    action = 'update'

    const res1 = await request(app)
      .patch(`/api/posts/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res1.body).to.have.property('error', 'Invalid post ID')

    action = 'upvote'

    const res2 = await request(app)
      .patch(`/api/posts/${invalidId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res2.body).to.have.property('error', 'Invalid post ID')
  })

  it('should return 400 for no content/title for update action', async () => {
    action = 'update'

    const res = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Title and content are required')
  })

  it('should return 404 for no post found for update action', async () => {
    action = 'update'

    const newPostId = new mongoose.Types.ObjectId()

    const newContent = {
      title: 'New Post Title',
      content: 'New post example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
    }

    const res = await request(app)
      .patch(`/api/posts/${newPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(newContent)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })

  it('should return 404 for no post found for upvote action', async () => {
    action = 'upvote'

    const newPostId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .patch(`/api/posts/${newPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })

  it('should return 500 for wrong updated post title', async () => {
    action = 'update'

    const postData1 = {
      title: 'A',
      content: `Too short title + ${generateRandomString(50)}`
    }

    const res1 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(postData1)
      .expect(500)

    expect(res1.body).to.have.property('error', 'Validation failed: title: Post title must be at least 3 characters long')

    const postData2 = {
      title: `${generateRandomString(251)}`,
      content: `Too long title + ${generateRandomString(50)}`
    }

    const res2 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(postData2)
      .expect(500)

    expect(res2.body).to.have.property('error', 'Validation failed: title: Post title cannot exceed 250 characters')
  })

  it('should return 500 for wrong updated post content', async () => {
    action = 'update'

    const postData1 = {
      title: 'Too short content',
      content: `${generateRandomString(49)}`
    }

    const res1 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(postData1)
      .expect(500)

    expect(res1.body).to.have.property('error', 'Validation failed: content: Post content must be at least 50 characters long')

    const postData2 = {
      title: 'Too long content',
      content: `${generateRandomString(2501)}`
    }

    const res2 = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .send(postData2)
      .expect(500)

    expect(res2.body).to.have.property('error', 'Validation failed: content: Post content cannot exceed 2500 characters')
  })

  it('should return 400 for invalid action chosen', async () => {
    action = 'blahblahaction'

    const res = await request(app)
      .patch(`/api/posts/${testPostId}?action=${action}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid action')
  })
})
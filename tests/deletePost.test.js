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

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

describe('DELETE /api/posts/:id', () => {
  let token
  let userId
  let testPostId
  let testPostTitle

  before(async () => {
    await User.deleteMany({ username: 'Delete Post User' })

    const userData = {
      email: 'deletepostuser@example.com',
      password: 'Password123!',
      username: 'Delete Post User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Delete Post User', email: 'deletepostuser@example.com' })

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
      testPostTitle = createdPost.title
    }
  })

  afterEach(async () => {
    await Post.deleteMany({ author_id: userId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Delete Post User' })
  })

  it('should succesfully delete post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.deep.include({
      message: `Post ${testPostTitle} with id ${testPostId} and it's related comments have been deleted succesfully`,
      post: {
        _id: testPostId.toString(),
        author_id: userId.toString(),
        title: testPostTitle
      },
      commentsDeleted: 0
    })

    const secondRes = await request(app)
      .get(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(secondRes.body).to.have.property('error', 'Post not found')
  })

  it('should return 400 for invalid id', async () => {
    const invalidId = uuidv4()

    const res = await request(app)
      .delete(`/api/posts/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid post ID')
  })

  it('should return 404 for wrong user/post combination', async () => {
    const userData = {
      username: 'Testing123',
      email: 'testing123@example.com',
      password: 'Testing123!'
    }

    const signupRes = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const newUserToken = signupRes.body.token

    const newPostId = new mongoose.Types.ObjectId()

    const firstRes = await request(app)
      .delete(`/api/posts/${newPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(firstRes.body).to.have.property('error', 'Post not found')

    const secondRes = await request(app)
      .delete(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${newUserToken}`)
      .expect(404)

    expect(secondRes.body).to.have.property('error', 'Post not found')

    await User.deleteMany({ username: 'Testing123' })
  })
})
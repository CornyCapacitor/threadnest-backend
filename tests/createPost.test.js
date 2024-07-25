const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
require('dotenv')

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

describe('POST /api/posts', () => {
  let token
  let userId

  before(async () => {
    await User.deleteMany({ username: 'Create Post User' })

    const userData = {
      email: 'createpostuser@example.com',
      password: 'Password123!',
      username: 'Create Post User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Create Post User', email: 'createpostuser@example.com' })

    if (user) {
      userId = user._id
      token = res.body.token
    }
  })

  beforeEach(async () => {
    await Post.deleteMany({ author_id: userId })
  })

  afterEach(async () => {
    await Post.deleteMany({ author_id: userId })
  })

  after(async () => {
    await User.deleteMany({ username: 'Create Post User' })
  })

  it('should succesfully create new post', async () => {
    const postData = {
      title: 'Test post',
      content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
    }

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(postData)
      .expect(201)

    expect(res.body).to.deep.include({
      author_id: userId.toString(),
      title: 'Test post',
      content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.',
    })

    const post = await request(app)
      .get(`/api/posts/${res.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(post.body._id).to.equal(res.body._id)
  })

  it('should return 400 for no title nor content included', async () => {
    const firstRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test post' })
      .expect(400)

    expect(firstRes.body).to.have.property('error', 'Title and content are required')

    const secondRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.' })
      .expect(400)

    expect(secondRes.body).to.have.property('error', 'Title and content are required')

    const thirdRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(thirdRes.body).to.have.property('error', 'Title and content are required')
  })

  it('should return 500 for wrong title', async () => {
    const firstPostData = {
      title: 'A',
      content: `Too short title + ${generateRandomString(50)}`
    }

    const firstRes = await request(app)
      .post('/api/posts')
      .send(firstPostData)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(firstRes.body).to.have.property('error', 'Post validation failed: title: Post title must be at least 3 characters long')

    const secondPostData = {
      title: `${generateRandomString(251)}`,
      content: `Too long title + ${generateRandomString(50)}`
    }

    const secondRes = await request(app)
      .post('/api/posts')
      .send(secondPostData)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(secondRes.body).to.have.property('error', 'Post validation failed: title: Post title cannot exceed 250 characters')
  })

  it('should return 500 for wrong content', async () => {
    const firstPostData = {
      title: 'Too short content',
      content: `${generateRandomString(49)}`
    }

    const firstRes = await request(app)
      .post('/api/posts')
      .send(firstPostData)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(firstRes.body).to.have.property('error', 'Post validation failed: content: Post content must be at least 50 characters long')

    const secondPostData = {
      title: 'Too long content',
      content: `${generateRandomString(2501)}`
    }

    const secondRes = await request(app)
      .post('/api/posts')
      .send(secondPostData)
      .set('Authorization', `Bearer ${token}`)
      .expect(500)

    expect(secondRes.body).to.have.property('error', 'Post validation failed: content: Post content cannot exceed 2500 characters')
  })
})
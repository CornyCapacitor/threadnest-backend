const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
require('dotenv')

describe('DELETE /api/users/:id', () => {
  let userId
  let userUsername
  let userEmail
  let postId
  let postTitle
  let commentId
  let token

  beforeEach(async () => {
    await User.deleteMany({ username: 'Login User' })

    const userData = {
      email: 'deleteuser@example.com',
      password: 'Password123!',
      username: 'Delete User'
    }

    const res = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(201)

    const user = await User.findOne({ username: 'Delete User', email: 'deleteuser@example.com' })

    if (user) {
      userId = user._id
      userUsername = user.username
      userEmail = user.email
      token = res.body.token
    }

    // Adding 1 post
    const postData = {
      author_id: userId,
      title: `${uuidv4()}`,
      content: 'Example content that has to be at least 50 characters long, so I need to make sure it is long enough to proceed.'
    }

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(postData)
      .expect(201)


    if (postRes) {
      postId = postRes.body._id
      postTitle = postData.title
    }

    // Adding 1 comment to the post
    const commentData = {
      author_id: userId,
      content: 'Example content',
      post_id: postId
    }

    const commentRes = await request(app)
      .post(`/api/comments/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(commentData)
      .expect(201)

    if (commentRes) {
      commentId = commentRes.body._id
    }
  })

  afterEach(async () => {
    await User.deleteMany({ username: 'Delete User' })
    await Post.deleteMany({ author_id: userId, title: postTitle, _id: postId })
    await Comment.deleteMany({ author_id: userId, post_id: postId, _id: commentId })
  })

  it('should succesfully delete user when user in params matches user in headers', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).to.have.property('message', `User ${userUsername} with id ${userId} and his related posts/comments have been deleted succesfully`)
    expect(res.body).to.have.deep.property('user', { _id: userId.toString(), email: userEmail, username: userUsername })
    expect(res.body).to.have.property('postsDeleted', 1)
    expect(res.body).to.have.property('commentsDeleted', 1)

    const user = await User.findOne({ _id: userId })
    expect(user).to.not.exist

    const post = await Post.findOne({ _id: postId })
    expect(post).to.not.exist

    const comment = await Comment.findOne({ _id: commentId })
    expect(comment).to.not.exist
  })

  it('should return 400 for invalid user id', async () => {
    const invalidId = uuidv4()

    const res = await request(app)
      .delete(`/api/users/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid user ID')

    const user = await User.findOne({ _id: userId })
    expect(user).to.exist

    const post = await Post.findOne({ _id: postId })
    expect(post).to.exist

    const comment = await Comment.findOne({ _id: commentId })
    expect(comment).to.exist
  })

  it('should return 401 when user in params doesn not match user in headers', async () => {
    const invalidId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .delete(`/api/users/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)

    expect(res.body).to.have.property('error', 'Logged user does not match user in params')
  })
})
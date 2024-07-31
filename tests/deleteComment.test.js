const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')

describe('DELETE /api/comments/:id', async () => {
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

  it('should succesfully delete post comment', async () => {
    const res1 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res1.body).to.be.an('array')
    expect(res1.body).to.have.lengthOf(1)
    expect(res1.body[0]).to.deep.include({
      _id: commentId.toString(),
      author_id: userId.toString(),
      post_id: testPostId.toString(),
      content: 'Test post content',
      upvotesCount: 0,
      upvoted: false,
    })

    const res2 = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res2.body).to.have.property('message', 'Comment deleted succesfully')

    const res3 = await request(app)
      .get(`/api/comments/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res3.body).to.have.property('error', 'No comments found')
  })

  it('should return 400 for invalid id', async () => {
    const invalidId = uuidv4()

    const res = await request(app)
      .delete(`/api/comments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)

    expect(res.body).to.have.property('error', 'Invalid comment ID')
  })

  it('should return 404 when no comment found', async () => {
    const invalidId = new mongoose.Types.ObjectId()

    const res = await request(app)
      .delete(`/api/comments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'Comment not found')
  })

  it('should find the comment but refuse to delete due to wrong user', async () => {
    const newId = new mongoose.Types.ObjectId()

    const otherUserCommentData = new Comment({
      author_id: newId,
      content: 'Other user comment',
      post_id: testPostId
    })

    let otherUserCommentId

    await otherUserCommentData.save()

    const otherUserComment = await Comment.findOne({ author_id: newId, content: 'Other user comment', post_id: testPostId })

    if (otherUserComment) {
      otherUserCommentId = otherUserComment._id
    }

    const res = await request(app)
      .delete(`/api/comments/${otherUserCommentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)

    expect(res.body).to.have.property('error', 'User id and author_id are not equal')
  })

  it('should return 404 for no related post found', async () => {
    await Post.deleteMany({ author_id: userId })

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'Post not found')
  })
})
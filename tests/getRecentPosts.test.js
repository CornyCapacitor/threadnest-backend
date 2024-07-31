const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const User = require('../models/userModel');
const Post = require('../models/postModel')

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

  it('should return latest posts', async function () {
    this.timeout(10000)

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
    const postPromises = []

    for (let i = 0; i < 40; i++) {
      const post = new Post({
        author_id: userId,
        title: `Test post ${Math.random()}`,
        content: 'Example content to use it inside all the tests. It is at least 50 characters long so nothing breaks due to model requirements.'
      })
      postPromises.push(post.save())
      await delay(10)
    }

    await Promise.allSettled(postPromises)

    // Fetch the first 20 posts (load=1 by default)
    const firstRes = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(firstRes.body).to.be.an('array')
    expect(firstRes.body.length).to.equal(20)

    // Fetch the next 20 posts (load=2)
    const secondRes = await request(app)
      .get('/api/posts?load=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(secondRes.body).to.be.an('array')
    expect(secondRes.body.length).to.equal(20)

    const responses = firstRes.body.concat(secondRes.body)

    const uniquePosts = new Set(responses.map(post => post._id));
    expect(uniquePosts.size).to.equal(responses.length);

    responses.forEach(post => {
      expect(post.author_id).to.equal(userId.toString())
      expect(post.upvoted).to.be.false
    })
  })

  it('should not return any post skipping millions of posts', async () => {
    const res = await request(app)
      .get('/api/posts?load=1000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)

    expect(res.body).to.have.property('error', 'No posts found')
  })
})
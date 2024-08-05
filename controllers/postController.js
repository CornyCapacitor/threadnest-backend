const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const User = require('../models/userModel')

// GET recent posts
// Example: /api/posts?load=3
const getRecentPosts = async (req, res) => {
  const userId = req.user._id
  const load = req.query.load || 1
  const limit = 20
  const skipBy = (load - 1) * limit

  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skipBy)
      .limit(limit)
      .populate({
        path: 'author_id',
        select: '_id'
      })

    if (!posts.length) {
      return res.status(404).send({ error: 'No posts found' })
    }

    const response = posts.map(post => {
      const isUpvoted = post.upvotes.includes(userId)

      return {
        _id: post._id,
        author_id: post.author_id,
        title: post.title,
        content: post.content,
        upvotesCount: post.upvotes.length,
        commentsCount: post.comments.length,
        upvoted: isUpvoted
      }
    })

    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ error: 'Failed to fetch recent posts' })
  }
}

// GET a single post
// Example: /api/posts/507f191e810c19729de860ea
const getSinglePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    const post = await Post.findById(id)
      .populate('author_id', 'username')

    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    const isUpvoted = post.upvotes.includes(userId)

    const response = {
      _id: post._id,
      author_id: post.author_id,
      title: post.title,
      content: post.content,
      upvotesCount: post.upvotes.length,
      commentsCount: post.comments.length,
      upvoted: isUpvoted
    }

    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ message: 'An error occured while fetching the post' })
  }
}

// POST a new post
// Example: /api/posts/
const createPost = async (req, res) => {
  const { title, content } = req.body
  const userId = req.user._id

  try {
    if (!title || !content) {
      return res.status(400).send({ error: 'Title and content are required' })
    }

    const post = new Post({
      author_id: userId,
      title,
      content
    })

    await post.save()

    return res.status(201).send(post)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// DELETE a post
// Example: /api/posts/507f191e810c19729de860ea
const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    const deletePost = await Post.findOneAndDelete({ author_id: userId, _id: id })

    if (!deletePost) {
      return res.status(404).send({ error: 'Post not found' })
    }

    const deletePostComments = await Comment.deleteMany({ post_id: id })

    const responsePost = {
      _id: deletePost._id,
      author_id: deletePost.author_id,
      title: deletePost.title,
    }

    const response = {
      message: `Post ${deletePost.title} with id ${deletePost._id} and it's related comments have been deleted succesfully`,
      post: responsePost,
      commentsDeleted: deletePostComments.deletedCount
    }

    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ error: 'Failed to delete post' })
  }
}

// UPDATE a post
// Example: /api/posts/507f191e810c19729de860ea?action=update
const updatePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  const { content, title } = req.body
  const { action } = req.query

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    switch (action) {
      case 'update':
        if (!content || !title) {
          return res.status(400).send({ error: 'Title and content are required' })
        }

        const updatedPost = await Post.findOneAndUpdate(
          { author_id: userId, _id: id },
          { $set: { title: title, content: content } },
          { new: true, runValidators: true }
        )

        if (!updatedPost) {
          return res.status(404).send({ error: 'Post not found' })
        }

        return res.status(200).send(updatedPost)

      case 'upvote':
        const post = await Post.findOne({ _id: id })

        if (!post) {
          return res.status(404).send({ error: 'Post not found' });
        }

        const hasUpvoted = post.upvotes.includes(userId)

        if (hasUpvoted) {
          post.upvotes.pull(userId)
        } else {
          post.upvotes.push(userId);
        }

        await post.save()

        return res.status(200).send(post)

      default:
        return res.status(400).send({ error: 'Invalid action' })
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

module.exports = {
  getRecentPosts,
  getSinglePost,
  createPost,
  deletePost,
  updatePost,
}
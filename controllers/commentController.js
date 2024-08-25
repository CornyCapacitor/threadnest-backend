const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')

// GET single post's comments
// Example: /api/comments/507f191e810c19729de860ea
const getComments = async (req, res) => {
  const { id } = req.params // post ID
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    const comments = await Comment.find({ post_id: post._id })
      .populate({
        path: 'author_id',
        select: '_id username'
      })

    if (!comments.length) {
      return res.status(404).send({ error: 'No comments found' })
    }

    const response = comments.map(comment => {
      const isUpvoted = comment.upvotes.includes(userId)

      return {
        _id: comment._id,
        author_id: comment.author_id._id,
        author_username: comment.author_id.username,
        post_id: comment.post_id,
        content: comment.content,
        upvotesCount: comment.upvotes.length,
        createdAt: comment.createdAt,
        upvoted: isUpvoted
      }
    })

    return res.status(200).send(response)
  } catch (error) {
    return res.status(500).send({ error: 'Failed to fetch comments' })
  }
}

// POST a new comment
// Example: /api/comments/507f191e810c19729de860ea
const createComment = async (req, res) => {
  const { id } = req.params // post ID
  const { content } = req.body
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    if (!content) {
      return res.status(400).send({ error: 'Content is required' })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    const comment = new Comment({
      author_id: userId,
      content,
      post_id: post._id
    })

    await comment.save()

    post.comments.push(comment._id)
    await post.save()

    return res.status(201).send(comment)
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

// DELETE a comment
// Example: /api/comments/507f191e810c19729de860ea
const deleteComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid comment ID' })
    }

    const comment = await Comment.findById(id)

    if (!comment) {
      return res.status(404).send({ error: 'Comment not found' })
    }

    if (comment.author_id != userId) {
      return res.status(401).send({ error: 'User id and author_id are not equal' })
    }

    const postId = comment.post_id

    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    await Comment.findOneAndDelete({ author_id: userId, _id: id })

    post.comments.pull(id)
    await post.save()

    return res.status(200).send({ message: 'Comment deleted succesfully' })
  } catch (error) {
    return res.status(500).send({ error: 'Failed to delete comment' })
  }
}

// UPDATE a comment
// Example: /api/comments/507f191e810c19729de860ea
const updateComment = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const { action } = req.query
  const userId = req.user._id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid comment ID' })
    }

    switch (action) {
      case 'update':
        if (!content) {
          return res.status(400).send({ error: 'Content is required for patch' })
        }

        const updatedComment = await Comment.findOneAndUpdate(
          { author_id: userId, _id: id },
          { $set: { content: content } },
          { new: true, runValidators: true }
        )

        if (!updatedComment) {
          return res.status(404).send({ error: 'Comment not found' })
        }

        return res.status(200).send(updatedComment)

      case 'upvote':
        const comment = await Comment.findOne({ _id: id })

        if (!comment) {
          return res.status(404).send({ error: 'Comment not found' })
        }

        const hasUpvoted = comment.upvotes.includes(userId)

        if (hasUpvoted) {
          comment.upvotes.pull(userId)
        } else {
          comment.upvotes.push(userId)
        }

        await comment.save()

        const response = {
          _id: comment._id,
          upvotesCount: comment.upvotes.length,
          upvoted: !hasUpvoted
        }

        return res.status(200).send(response)

      default:
        return res.status(400).send({ error: 'Invalid action' })
    }
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
}

module.exports = {
  getComments,
  createComment,
  deleteComment,
  updateComment
}
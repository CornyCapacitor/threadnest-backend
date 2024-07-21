const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')

// GET single post's comments
// Example: /api/comments/507f191e810c19729de860ea
const getComments = async (req, res) => {
  const { id } = req.params // post ID
  const userId = req.user._id

  try {
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Check if the post exists
    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    // Fetching comments related to the post
    const comments = await Comment.find({ post_id: post._id })
      .populate({
        path: 'author_id',
        select: '_id'
      })

    if (!comments.length) {
      return res.status(404).send({ error: 'No comments found' })
    }

    // Constructing response
    const response = comments.map(comment => {
      // Check if userId exists in the upvotes array
      const isUpvoted = comment.upvotes.includes(userId)

      return {
        _id: comment._id,
        author_id: comment.author_id,
        post_id: comment.post_id,
        content: comment.content,
        upvotesCount: comment.upvotes.length,
        upvoted: isUpvoted
      }
    })

    // Sending back the comments
    return res.status(200).send(response)
  } catch (error) {
    // Sending back the error
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
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Check if the post exists
    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    // Constructing new comment
    const comment = new Comment({
      author_id: userId,
      content,
      post_id: post._id
    })

    // Creating new comment insite the database
    await comment.save()

    // Updating the post with the new comment
    post.comments.push(comment._id)
    await post.save()

    // Sending back the response
    return res.status(201).send(comment)
  } catch (error) {
    // Sending back the error
    return res.status(500).send({ message: 'Failed to create a comment' })
  }
}

// DELETE a comment
// Example: /api/comments/507f191e810c19729de860ea
const deleteComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id

  try {
    // Check if ID of a comment is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid comment ID' })
    }

    const comment = await Comment.findById(id)

    // Check if comment with given id exists
    if (!comment) {
      return res.status(404).send({ error: 'Comment not found' })
    }

    // Check if comment author and authorized user are equal (!= is intentional)
    if (comment.author_id != userId) {
      return res.status(401).send({ error: 'User id and author_id are not equal' })
    }

    const postId = comment.post_id

    const post = await Post.findById(postId)

    // Check if post with given id exists
    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    // Delete the comment
    await Comment.findOneAndDelete({ author_id: userId, _id: id })

    // Delete comment from post comments
    post.comments.pull(id)
    await post.save()

    // Sending back the response
    return res.status(200).send({ message: 'Comment deleted succesfully' })
  } catch (error) {
    // Sending back the error
    console.error(error)
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
    // Check if ID of a comment is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid comment ID' })
    }

    switch (action) {
      case 'update':
        // Check if there's content inside given body
        if (!content) {
          return res.status(400).send({ error: 'Content is required for patch' })
        }

        const updatedComment = await Comment.findOneAndUpdate(
          { author_id: userId, _id: id },
          { $set: { content: content } },
          { new: true }
        )

        // Check if update was succesfull
        if (!updatedComment) {
          return res.status(404).send({ error: 'Comment not found' })
        }

        // Sending back the response
        return res.status(200).send({ message: `Updated comment: ${updatedComment}` })

      case 'upvote':
        const comment = await Comment.findOne({ _id: id })

        // Check if comment exists
        if (!comment) {
          return res.status(404).send({ error: 'Comment not found' })
        }

        // Check if user has already upvoted the comment
        const hasUpvoted = comment.upvotes.includes(userId)

        if (hasUpvoted) {
          // Remove the user's upvote
          comment.upvotes.pull(userId)
        } else {
          // Add the user's upvote
          comment.upvotes.push(userId)
        }

        await comment.save()

        // Sending back the response
        return res.status(200).send(comment)

      default:
        return res.status(400).send({ error: 'Invalid action' })
    }
  } catch (error) {
    // Sending back the error
    return res.status(400).send({ error: error.message })
  }
}

module.exports = {
  getComments,
  createComment,
  deleteComment,
  updateComment
}
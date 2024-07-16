const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')

// GET single post's comments
// Example: /api/comments/507f191e810c19729de860ea
const getComments = async (req, res) => {
  const { id } = req.params // post ID
  const userId = req.user._id

  try {
    // Checking if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Checking if the post exists
    if (!post) {
      return res.status(404).send({ message: 'Post not found' })
    }

    // Fetching comments related to the post
    const comments = await Comment.find({ post_id: post._id })
      .populate({
        path: 'author_id',
        select: '_id'
      })

    if (!comments.length) {
      res.status(404).send({ message: 'No comments found' })
    }

    const response = comments.map(comment => {
      // Checking if userId exists in the upvotes array
      const isUpvoted = comment.upvotes.includes(userId)

      // Constructing correct object response for the frontend
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
    res.status(200).send(response)
  } catch (error) {
    // Sending back the error
    console.error('Error fetching comments:', error)
    res.status(500).send({ error: 'Failed to fetch comments' })
  }
}

// POST a new comment
// Example: /api/comments/507f191e810c19729de860ea
const createComment = async (req, res) => {
  const { id } = req.params // post ID
  const { content } = req.body
  const userId = req.user._id

  try {
    // Checking if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Checking if the post exists
    if (!post) {
      return res.status(404).send({ message: 'Post not found' })
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
    return res.status(200).send(comment)
  } catch (error) {
    // Sending back the error
    console.error(error)
    return res.status(500).send({ message: 'Failed to create a comment' })
  }
}

// DELETE a comment/post related comments
// Example: /api/comments/507f191e810c19729de860ea
const deleteComment = async (req, res) => {
  const { id } = req.params // comment/post ID

  try {
    // Check if ID of a comment is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid comment ID' })
    }

    const comment = await Comment.findById(id)

    // Checking if comment with given id exists
    if (!comment) {
      return res.status(404).send({ error: 'Comment not found' })
    }

    const postId = comment.post_id

    const post = await Post.findById(postId)

    // Checking if post with given id exists
    if (!post) {
      return res.status(404).send({ error: 'Post not found' })
    }

    // Delete the comment
    await comment.remove()

    // Sending back the response
    return res.status(200).send({ message: 'Comment deleted succesfully' })
  } catch (error) {
    // Sending back the error
    console.error('Error fetching post:', error)
    return res.status(500).send({ error: 'Failed to delete comment' })
  }
}

// UPDATE a comment
// Example: /api/comments/507f191e810c19729de860ea
const updateComment = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user._id

  try {
    // Check if there's content inside given body
    if (!username) {
      return res.status(400).send({ message: 'Content is required for patch' })
    }

    // Checking if ID of a comment is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid comment ID' })
    }

    // Checking if ID of a user is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid user ID' })
    }

    const updatedComment = await Comment.findOneAndUpdate(
      { author_id: userId, _id: id },
      { $set: { content: content } },
      { new: true }
    )

    // Checking if update was succesfull
    if (!updatedComment) {
      return res.status(404).send({ message: 'Comment not found' })
    }

    // Sending back the response
    res.status(200).send({ message: `Updated comment: ${updatedComment}` })
  } catch (error) {
    // Sending back the error
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getComments,
  createComment,
  deleteComment,
  updateComment
}
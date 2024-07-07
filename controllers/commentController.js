const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')

// GET single post's comments
// Example: /api/comments/507f191e810c19729de860ea
const getComments = async (req, res) => {
  const { id } = req.params // post ID

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
      .populate('author_id', 'username')
      .select('content author_id createdAt upvotesCount')

    // Sending back the comments
    res.status(200).send(comments)
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
  const { userId } = req.user_id

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

    const user = await User.findById(userId)

    // Check if there's a user with given ID
    if (!user) {
      return res.status(404).send({ message: 'User not found' })
    }

    // Constructing new comment
    const newComment = new Comment({
      author_id: user._id,
      content: content,
      post_id: post._id
    })

    // Saving new comment document
    await newComment.save()

    // Updating post's information
    post.commentsCount = post.comments.length

    // Saving changes made to the post
    await post.save()

    // Sending back the response
    return res.status(200).send(newComment)
  } catch (error) {
    // Sending back the error
    return res.status(500).send({ message: 'Failed to create a comment' })
  }
}

// DELETE a comment/post related comments
// Example: /api/comments/507f191e810c19729de860ea
const deleteComment = async (req, res) => {
  const { id } = req.params // comment/post ID
  const { action } = req.query // delete type

  switch (action) {
    case 'single':
      // Single comment delete
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

    case 'multiple':
      // All post related comments delete
      try {
        // Check if ID of a post is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid post ID' })
        }

        // Finding and deleting all comments related to the post
        const result = await Comment.deleteMany({ post_id: id })

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'No comments found for this post' })
        }

        // Send back the response
        return res.status(200).send({ message: `Succesfully deleted ${result.deletedCount} comments` })
      } catch (error) {
        // Sending back the error
        return res.status(500).send({ message: 'Failed to delete comments' })
      }

    default:
      return res.status(400).send({ message: 'Invalid action' })
  }
}
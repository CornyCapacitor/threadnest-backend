const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')
const User = require('../models/userModel')

// GET recent posts
// Example: /api/posts/
const getRecentPosts = async (req, res) => {
  // Fetching user ID from the request (Must be an ObjectId due to using Array.includes later on)
  const userId = req.user._id

  try {
    // Fetching recent posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'author_id',
        select: '_id'
      })

    if (!posts.length) {
      return res.status(404).send({ error: 'No posts found' })
    }

    const response = posts.map(post => {
      // Checking if userId exists in the upvotes array
      const isUpvoted = post.upvotes.includes(userId)

      // Constructing correct object response for the frontend
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

    // Sending back the response
    res.status(200).send(response)
  } catch (error) {
    // Sending back the error
    console.error('Error fetching posts:', error)
    res.status(500).send({ error: 'Failed to fetch recent posts' })
  }
}

// GET a single post
// Example: /api/posts/507f191e810c19729de860ea
const getSinglePost = async (req, res) => {
  const { id } = req.params;
  // Fetching user ID from the request (Must be an ObjectId due to using Array.includes later on)
  const userId = req.user._id

  try {
    // Checking if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    // Fetching and expanding the post by author information
    const post = await Post.findById(id)
      .populate('author_id', 'username')

    // Checking if the post exists
    if (!post) {
      return res.status(404).send({ message: 'Post not found' })
    }

    // Checking if userId exists in the upvotes array
    const isUpvoted = post.upvotes.includes(userId)

    // Constructing correct object response for the frontend
    const response = {
      _id: post._id,
      author_id: post.author_id,
      title: post.title,
      content: post.content,
      upvotesCount: post.upvotes.length,
      commentsCount: post.comments.length,
      upvoted: isUpvoted
    }

    // Sending back the response
    res.status(200).send(response)
  } catch (error) {
    // Sending back the error
    console.error('Error fetching post:', error)
    res.status(500).send({ message: 'An error occured while fetching the post' })
  }
}

// POST a new post
// Example: /api/posts/
const createPost = async (req, res) => {
  const { title, content } = req.body
  const userId = req.user._id

  try {
    // Validating entry data
    if (!title || !content) {
      return res.status(400).send({ error: 'Title and content are required' })
    }

    // Constructing new post information based on given data in request
    const post = new Post({
      author_id: userId,
      title,
      content
    })

    // Creating new post inside the database
    await post.save()

    // Sending back the response
    res.status(201).send(post)
  } catch (error) {
    // Sending back the error
    console.error('Error during creating a new post:', error)
    res.status(500).send({ error: 'Failed to create new post' })
  }
}

// DELETE a post
// Example: /api/posts/507f191e810c19729de860ea
const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id

  try {
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    const post = await Post.findOne({ author_id: userId, _id: id })

    // Checking if post with combination of this author_id and _id exists
    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    // Deleting the post
    await Post.findOneAndDelete({ author_id: userId, _id: id })

    // Deleting post related comments
    const deletePostComments = await Comment.deleteMany({ post_id: id })

    // Removing unnecessary information from response
    const responsePost = {
      _id: post._id,
      author_id: post.author_id,
      title: post.title,
    }

    // Constructing response
    const response = {
      message: `Post ${post.title} with id ${post._id} and it's related comments have been deleted succesfully`,
      post: responsePost,
      commentsDeleted: deletePostComments.deletedCount
    }

    // Sending back the response
    return res.send(response)
  } catch (error) {
    // Sending back the error
    console.error('Error fetching post:', error)
    return res.status(500).send({ error: 'Failed to delete post' })
  }
}

// UPDATE a post
// Example: /api/posts/507f191e810c19729de860ea
const updatePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user._id
  const { content, title } = req.body
  const { action } = req.query

  try {
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    let post

    switch (action) {
      case 'post':
        // Check if there's proper given request body
        if (!content || !title) {
          return res.status(400).send({ message: 'Title and content are required' })
        }

        post = await Post.findOne({ author_id: userId, _id: id })

        // Checking if post with combination of this author_id and _id exists
        if (!post) {
          return res.status(404).send({ message: 'Post not found' });
        }

        // Updating the post in database
        const updatedPost = await Post.findOneAndUpdate(
          { _id: id },
          { $set: { title: title, content: content } },
          { new: true }
        )

        // Sending back the response
        return res.status(200).send(updatedPost)

      case 'upvote':
        // Check if post exists
        post = await Post.findOne({ _id: id })

        // Checking if post with given id exists
        if (!post) {
          return res.status(404).send({ message: 'Post not found' });
        }

        // Checking if user has already upvoted the post
        const hasUpvoted = post.upvotes.includes(userId)

        if (hasUpvoted) {
          // Remove the user's upvote
          post.upvotes = post.upvotes.filter(upvote => upvote.toString() !== userId.toString());
        } else {
          // Add the user's upvote
          post.upvotes.push(userId);
        }

        await post.save()

        // Sending back the response
        return res.status(200).send(post)

      default:
        return res.status(400).send({ message: 'Invalid action' })
    }
  } catch (error) {
    // Sending back the error
    return res.status(500).send({ message: 'Failed to update post' })
  }
}

module.exports = {
  getRecentPosts,
  getSinglePost,
  createPost,
  deletePost,
  updatePost,
}
const mongoose = require('mongoose')
const Post = require('../models/postModel')
const Comment = require('../models/commentModel')

// GET recent posts
const getRecentPosts = async (req, res) => {
  // Fetching user ID from the request (Must be an ObjectId due to using Array.includes later on)
  const { userId } = req.user_id

  try {
    // Fetching recent posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'author_id',
        select: '_id'
      })

    const response = posts.map(post => {
      // Checking if userId exists in the upvotes array
      const isUpvoted = post.upvotes.includes(userId)

      // Constructing correct object response for the frontend
      return {
        _id: post._id,
        author_id: post.author_id,
        title: post.title,
        content: post.content,
        upvotesCount: post.upvotesCount,
        commentsCount: post.commentsCount,
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
const getSinglePost = async (req, res) => {
  const { id } = req.params;
  // Fetching user ID from the request (Must be an ObjectId due to using Array.includes later on)
  const { userId } = req.user_id

  try {
    // Checking if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
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
      upvotesCount: post.upvotesCount,
      commentsCount: post.commentsCount,
      upvoted: isUpvoted
    }

    // Sending back the response
    res.status(200).send(post)
  } catch (error) {
    // Sending back the error
    console.error('Error fetching post:', error)
    res.status(500).send({ message: 'An error occured while fetching the post' })
  }
}

// POST a new post
const createPost = async (req, res) => {
  const { author_id, title, content } = req.body
  try {
    // Validating entry data
    if (!author_id || !title || !content) {
      return res.status(400).send({ error: 'author_id, title and content are required' })
    }

    const user = await User.findById(author_id)

    // Checking if the user exists
    if (!user) {
      return res.status(404).send({ error: `Failed to find user with ID: ${author_id}` })
    }

    // Constructing new post information based on given data in request
    const post = new Post({
      author_id,
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
    response.status(500).send({ error: 'Failed to create new post' })
  }
}

// DELETE a post
const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Checking if post with given id exists
    if (!post) {
      return response.status(404).send({ error: 'Post not found' })
    }

    // Deleting the post from the database
    await post.remove()

    // Sending back the response
    response.send({ message: 'Post deleted succesfully' })
  } catch (error) {
    // Sending back the error
    console.error('Error fetching post:', error)
    response.status(500).send({ error: 'Failed to delete post' })
  }
}

// UPDATE a post
const updatePost = async (req, res) => {
  const { id } = req.params
  const { action } = req.query
  const { userId } = req.user_id
  const { content } = req.body

  try {
    // Check if ID of a post is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    // Checking if post with given id exists
    if (!post) {
      return res.status(404).send({ message: 'Post not found' })
    }

    const user = await User.findById(user_id)

    // Check if there's a user with given ID
    if (!user) {
      return res.status(404).send({ message: 'User not found' })
    }

    switch (action) {
      // Upvote action
      case 'upvote':
        if (!post.upvotes.includes(userId)) {
          post.upvotes.push(userId);
          post.upvotesCount = post.upvotes.length;
        } else {
          post.upvotes = post.upvotes.filter(uid => uid.toString() !== userId.toString());
          post.upvotesCount = post.upvotes.length;
        }
        break

      // Comment action
      case 'comment':
        if (!content) {
          return res.status(400).send({ message: 'Content is required for comment' })
        }
        const newComment = new Comment({
          author_id: user._id, // or userId from request
          content: content,
          post_id: post.id // or id from request
        })

        // Creating new comment document
        await newComment.save()

        // Updating the post's information
        post.comments.push(newComment._id)
        post.commentsCount = post.comments.length
        break

      // Edit action
      case 'edit':
        // Checking if the one who wants to edit is the post author
        if (userId.toString() !== post.author_id.toString()) {
          return res.status(403).send({ message: 'You are not authorized to edit this post' });
        }

        // Updating post information based on request body
        if (title) post.title = title
        if (content) post.content = content
        break

      // When no comment/edit/upvote actions included
      default:
        return res.status(400).send({ message: 'Invalid action' })
    }

    // Update the post
    const updatedPost = await post.save()

    return res.status(200).send(updatedPost)
  } catch (error) {
    return res.status(500).send({ message: 'Failed to update post' })
  }
}
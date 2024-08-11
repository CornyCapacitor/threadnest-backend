const mongoose = require('mongoose')
mongoose.set('strictQuery', true)

const Schema = mongoose.Schema

const postSchema = new Schema({
  author_id: {
    type: String,
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  title: {
    type: String,
    minLength: [3, 'Post title must be at least 3 characters long'],
    maxLength: [250, 'Post title cannot exceed 250 characters'],
    required: [true, 'Title is required']
  },
  content: {
    type: String,
    minLength: [50, 'Post content must be at least 50 characters long'],
    maxLength: [2500, 'Post content cannot exceed 2500 characters'],
    required: [true, 'Content is required']
  },
  upvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)
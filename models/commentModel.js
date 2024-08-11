const mongoose = require('mongoose')
mongoose.set('strictQuery', true)

const Schema = mongoose.Schema

const commentSchema = new Schema({
  author_id: {
    type: String,
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  content: {
    type: String,
    maxLength: [500, 'Comment cannot exceed 500 characters'],
    required: [true, 'Content is required']
  },
  upvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID is required']
  },
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment
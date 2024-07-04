const mongoose = require('mongoose')
mongoose.set('StrictQuery', true)

const Schema = mongoose.Schema

const commentSchema = new Schema({
  author_id: {
    type: String,
    required: [true, 'Author ID is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  upvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  upvotesCount: {
    type: Number,
    default: 0
  },
  post_id: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID is required']
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment
const mongoose = require('mongoose')
mongoose.set('strictQuery', true)

const Schema = mongoose.Schema

const postSchema = new Schema({
  author_id: {
    type: String,
    required: [true, 'Author ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required']
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
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)
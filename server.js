require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const cors = require('cors')
const postRoutes = require('./routes/posts')
const userRoutes = require('./routes/users')
const commentRoutes = require('./routes/comments')

// App setup
const app = express()
const PORT = process.env.PORT

// CORS options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middlewares
app.use(express.json())
app.use('/', express.static(path.join(__dirname, 'public')))

// Routes
app.use('/', require('./routes/root'))
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/comments', commentRoutes)

// Connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
  // listen for requests
  app.listen(PORT, () => {
    console.log(`Connected to database & listening on port: ${PORT}`)
  })
})

module.exports = app
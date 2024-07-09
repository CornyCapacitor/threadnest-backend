require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const postRoutes = require('./routes/posts')
const userRoutes = require('./routes/user')

// App setup
const app = express()
const PORT = process.env.PORT

// Middlewares
app.use(express.json())

// Routes
app.get('/', (request, response) => {
  response.send({ message: 'Welcome to ThreadNest backend!' })
})
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)

// Connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
  // listen for requests
  app.listen(PORT, () => {
    console.log(`Connected to database & listening on port: ${PORT}`)
  })
})
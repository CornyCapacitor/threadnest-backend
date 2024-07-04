require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const postRoutes = require('./routes/posts')

// app setup
const app = express()
const PORT = process.env.PORT

// middlewares
app.use(express.json())

// routes
app.get('/', (request, response) => {
  response.send({ message: 'Welcome to ThreadNest backend!' })
})
app.use('/api/posts', postRoutes)

// connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
  // listen for requests
  app.listen(PORT, () => {
    console.log(`Connected to database & listening on port: ${PORT}`)
  })
})
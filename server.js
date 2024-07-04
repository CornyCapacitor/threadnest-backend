const mongoose = require('mongoose')
const express = require('express')
require('dotenv').config()

// app setup
const app = express()
const PORT = process.env.PORT

// middlewares
app.use(express.json())

// routes
app.get('/', (request, response) => {
  response.send({ message: 'Welcome to ThreadNest backend!' })
})

// connect to db
mongoose.connect(process.env.MONGO_URI).then(() => {
  // listen for requests
  app.listen(PORT, () => {
    console.log(`Connected to database & listening on port: ${PORT}`)
  })
})
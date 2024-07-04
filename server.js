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

// listener
app.listen(PORT, () => {
  console.log(`Server is working on ${PORT}`)
})
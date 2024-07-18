const mongoose = require('mongoose')
const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const cheerio = require('cheerio')

describe('GET /', () => {
  it('should succesfully connect to the database and respond correctly', async () => {
    const res = await request(app)
      .get('/')
      .expect(200)

    expect(res.headers['content-type']).to.include('text/html')

    const $ = cheerio.load(res.text)
    const header = $('h1').text()

    expect(header).to.equal('ThreadNest')

    // Close the connection after the test is done
    after(async () => {
      await mongoose.connection.close()
    })
  })
})
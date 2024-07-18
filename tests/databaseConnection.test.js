const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
require('dotenv').config()

const PORT = process.env.PORT

describe('Database Connection', () => {
  it('should successfully connect to the database', async () => {
    try {
      const response = await request(app).get('/');
      expect(response.status).to.equal(200);
    } catch (error) {
      console.error('Error connecting to the database:', error);
      throw error;
    }
  });
});
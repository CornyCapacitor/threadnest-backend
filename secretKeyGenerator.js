const crypto = require('crypto')

// Generate secret key function
const generateSecretKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex')
}

// Generating secret key with 32 bytes, 64 hex characters
const secretKey = generateSecretKey(32)
console.log(secretKey)
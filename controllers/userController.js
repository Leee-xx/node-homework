const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.scrypt)
const pool = require('../db/pg-pool')

const { userSchema } = require('../validation/userSchema')

async function register(req, res) {
  if (!req.body) req.body = {}

  const { error, value } = userSchema.validate(
    {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
    },
    { abortEarly: false }
  )

  if (error) {
    return res.status(400).json({
      error: error.message,
      details: error.details,
    })
  }

  // check for dupe emails
  const results = pool.query('SELECT * FROM users WHERE email = $1', [email])

  if (results.rows.length > 0) {
    return res.status(400).json({
      error: 'User already exists with this email',
    })
  }

  value.hashedPassword = await hashPassword(value.password)

  let user = null

  try {
    user = await pool.query(
      'INSERT INTO users (email, name, hashed_password) VALUES [$1, $2, $3] RETURNING id, email, name',
      [value.email, value.name, value.hashedPassword]
    )
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({
        error: 'Account with this email already exists',
      })
    }

    return next(e)
  }

  global.user_id = user.id

  res.status(201).json({ email: user.email, name: user.name })
}

async function logon(req, res) {
  const { email } = req.body

  const results = await pool.query('SELECT * FROM users WHERE email = $1', [email])

  if (results.rows.length === 0) {
    return res.status(401).json({ error: 'Username not found' })
  }

  const user = results.rows[0]
  const passwordMatches = await comparePassword(req.body.password, user.hashedPassword)

  if (!passwordMatches) {
    return res.status(401).json({
      error: 'Incorrect password',
    })
  }

  global.user_id = user.id

  const { hashed_password, ...sanitizedUser } = user
  res.status(200).json(sanitizedUser)
}

function logoff(req, res) {
  global.user_id = null

  res.status(200)
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)

  return `${salt}:${derivedKey.toString('hex')}`
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(':')
  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKey = await scrypt(inputPassword, salt, 64)

  return crypto.timingSafeEqual(keyBuffer, derivedKey)
}

module.exports = { register, logon, logoff }

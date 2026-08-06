const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.scrypt)
const pool = require('../db/pg-pool')
const prisma = require('../db/prisma')

const { userSchema } = require('../validation/userSchema')

async function register(req, res, next) {
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
      message: error.message,
      details: error.details,
    })
  }

  // check for dupe emails
  /*
  const results = await pool.query('SELECT * FROM users WHERE email = $1', [value.email])

  if (results.rows.length > 0) {
    return res.status(400).json({
      message: 'User already exists with this email',
    })
  }
  */

  value.hashedPassword = await hashPassword(value.password)
  delete value.password

  let user = null

  try {
    user = await prisma.user.create({
      data: value,
      select: { name: true, email: true, id: true },
    })
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({
        message: 'Account with this email already exists',
      })
    }

    return next(e)
  }

  global.user_id = user.id

  res.status(201).json({ email: user.email, name: user.name })
}

async function logon(req, res) {
  let { email } = req.body

  if (!email) {
    return res.status(400).json({
      message: 'Must provide email',
    })
  }

  email = email.toLowerCase()

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return res.status(401).json({ message: 'Username not found' })
  }

  const passwordMatches = await comparePassword(req.body.password, user.hashedPassword)

  if (!passwordMatches) {
    return res.status(401).json({
      message: 'Incorrect password',
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

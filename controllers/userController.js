const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.scrypt)

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
      error: error.message
    })
  }

  // check for dupe emails

  const hashedPassword = await hashPassword(value.password)

  const user = {
    name: value.name,
    email: value.email,
    hashedPassword,
  }

  global.users.push(user)
  global.user_id = user

  res.status(201).json({ email: user.email, name: user.name })
}

async function logon(req, res) {
  const { email } = req.body

  const user = global.users.find((u) => u.email == email)

  if (!user) {
    return res.status(401).json({ error: 'Username not found' })
  }

  const passwordMatches = await comparePassword(req.body.password, user.hashedPassword)

  if (!passwordMatches) {
    return res.status(401).json({
      error: 'Incorrect password',
    })
  }

  global.user_id = user

  const { password, ...sanitizedUser } = user
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

const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.script)

function register(req, res) {
  const user = {
    name: req.body.name,
    email: req.body.email,
    password: hashPassword(req.body.password),
  }

  global.users.push(user)
  global.user_id = user

  res.status(201).json({ name: user.name, email: user.email })
}

function logon(req, res) {
  const { email, password } = req.body

  const user = global.users.find((u) => u.email == email && u.password == password)

  if (user) {
    global.user_id = user
    res.status(200).json({ name: user.name, email: user.email })
  } else {
    res.status(401).json({ error: 'Username/password were incorrect' })
  }
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

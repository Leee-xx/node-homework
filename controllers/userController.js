const crypto = require('crypto')
const util = require('util')
const scrypt = util.promisify(crypto.scrypt)
const prisma = require('../db/prisma')
const jwt = require('jsonwebtoken')

const { userSchema } = require('../validation/userSchema')

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  }
}
const setJwtCookie = (req, res, user) => {
  const payload = { id: user.id, csrfToken: crypto.randomUUID() }
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  )

  res.cookie('jwt',
    token,
    {
      ...cookieFlags(req),
      maxAge: 60 * 60 * 1000,
    },
  )

  return payload.csrfToken
}

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

  const hashedPassword = await hashPassword(value.password)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name: value.name, email: value.email, hashedPassword },
        select: { name: true, email: true, id: true },
      })

      const welcomeTaskData = [
        { title: 'Complete your profile', userId: newUser.id, priority: 'medium' },
        { title: 'Add your first task', userId: newUser.id, priority: 'high' },
        { title: 'Explore the app', userId: newUser.id, priority: 'low' }
      ];

      await tx.task.createMany({ data: welcomeTaskData })

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map(t => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      })

      const csrfToken = setJwtCookie(req, res, newUser)
      return { user: newUser, welcomeTasks, csrfToken }
    })

    const { user, welcomeTasks, csrfToken } = result

    res.status(201).json({
      user,
      welcomeTasks,
      transactionStatus: 'success',
      csrfToken,
    })
    return
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        message: 'Email already registered',
      })
    } else {
      return next(err)
    }
  }

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

  const { hashed_password, ...sanitizedUser } = user
  const csrfToken = setJwtCookie(req, res, user)

  res.status(200).json({ user: sanitizedUser, csrfToken })
}

async function show(req, res) {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({
      message: 'Invalid user ID',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          priority: true,
          title: true,
          isCompleted: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    })
  }

  res.status(200).json(user)
}

function logoff(req, res) {
  res.clearCookie('jwt', cookieFlags(req))
  res.status(200).end()
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

module.exports = {
  register,
  logon,
  show,
  logoff,
}

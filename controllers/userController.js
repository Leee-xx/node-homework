const { randomUUID } = require('crypto')

function register(req, res) {
  const user = {
    id: randomUUID,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  }

  global.users.push(user)
  global.user_id = user.id

  res.status(201).json({ name: user.name, email: user.email })
}

function logon(req, res) {
  const { email, password } = req.body

  const user = global.users.find((u) => u.email == email && u.password == password)

  if (user) {
    global.user_id = user.id
    res.status(200).json({ name: user.name, email: user.email })
  } else {
    res.status(401).json({ error: 'Username/password were incorrect', requestId: req.requestId })
  }
}

function logoff(req, res) {
  global.user_id = null

  res.status(200).json({})
}

module.exports = { register, logon, logoff }

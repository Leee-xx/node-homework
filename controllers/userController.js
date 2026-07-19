function register(req, res) {
  const user = global.users.find((u) => u.email === req.body.email)

  if (user) {
    return res.status(409).json({
      error: 'Account already exists with this email',
    })
  }

  const newUser = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  }

  global.users.push(newUser)
  global.user_id = newUser

  res.status(201).json({ name: newUser.name, email: newUser.email })
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

module.exports = { register, logon, logoff }

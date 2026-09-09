require('dotenv').config()
const request = require('supertest')
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const prisma = require('../db/prisma')
let agent;
let saveRes;
const { app, server } = require('../app')

beforeAll(async () => {
  await prisma.Task.deleteMany()
  await prisma.User.deleteMany()

  agent = request.agent(app)
})

afterAll(async () => {
  prisma.$disconnect()
  server.close()
})

describe('register a user', () => {
  let saveRes = null
  let csrfToken = null

  const name = 'Foo Bar'
  const email = 'foo@bar.com'
  const password = 'Password123!'

  it('46. it creates the user entry', async () => {
    const newUser = {
      name,
      email,
      password,
    }

    saveRes = await await agent.post('/api/users/register')
      .set('X-Recaptcha-Test', process.env.RECAPTCHA_BYPASS)
      .send(newUser)
    expect(saveRes.status).toBe(201)
  })

  it('47. Registration returns an object with the expected name.', async () => {
    expect(saveRes.body.user.name).toBe(name)
  })

  it('48. Test that the returned object includes a csrfToken.', async () => {
    expect(saveRes.body.csrfToken).toBeDefined()
  })

  it('49. You can logon as the newly registered user.', async () => {
    saveRes = await agent.post('/api/users/logon').send({ email, password })
    csrfToken = saveRes.body.csrfToken
    expect(saveRes.status).toBe(200)
  })

  it('50. Verify that you are logged in: /api/tasks should not return a 401', async () => {
    saveRes = await agent.get('/api/tasks').send()
    expect(saveRes.status).toBe(200)
  })

  it('51. Verify that you can log out.', async () => {
    saveRes = await agent.post('/api/users/logoff')
      .set('X-CSRF-TOKEN', csrfToken)
      .send()
    expect(saveRes.status).toBe(200)
  })

  it('52. Make sure that you are really logged out: /api/tasks should now return a 401', async () => {
    saveRes = await agent.get('/api/tasks').send()
    expect(saveRes.status).toBe(401)
  })
})

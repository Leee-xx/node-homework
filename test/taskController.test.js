require('dotenv').config()
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const prisma = require('../db/prisma')
const httpMocks = require('node-mocks-http')
const EventEmitter = require('events')
const waitForRouteHandlerCompletion = require('./waitForRouteHandlerCompletion')

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require('../controllers/taskController')

let user1 = null
let user2 = null
let saveRes = null
let saveData = null
let saveTaskId = null
let validTitle = 'some title'

const createResponse = () => httpMocks.createResponse({ eventEmitter: EventEmitter }) 

beforeAll(async () => {
  await prisma.Task.deleteMany()
  await prisma.User.deleteMany()

  user1 = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@sample.com',
      hashedPassword: 'nonsense',
    },
  })

  user2 = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@sample.com',
      hashedPassword: 'nonsense',
    },
  })
})

afterAll(() => {
  prisma.$disconnect()
})

describe('testing task creation', () => {
  it("14. can't create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    })

    saveRes = createResponse()

    expect.assertions(1)
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes)
    } catch (e) {
      expect(e.name).toBe('TypeError')
    }
  })

  it("15. You can't create a task with a bogus user id.", async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: 'first task' },
    })
    req.user = { id: 99999 }

    saveRes = createResponse()

    expect.assertions(1)
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes)
    } catch (e) {
      expect(e.name).toBe('PrismaClientKnownRequestError')
    }
  })

  it('16. If you have a valid user id, create() succeeds (res.statusCode should be 201).', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: { title: validTitle },
    })
    req.user = user1
    saveRes = createResponse()

    await waitForRouteHandlerCompletion(create, req, saveRes)

    expect(saveRes.statusCode).toBe(201)
  })

  it('17. The object returned from the create() call has the expected title.', () => {
    saveData = saveRes._getJSONData()
    expect(saveData.title).toBe(validTitle)
  })

  it('18. The object has the right value for isCompleted.', () => {
    expect(saveData.isCompleted).toBe(false)
  })

  it('19. The object does not have any value for userId.', () => {
    saveTaskId = saveData.id
    expect(saveData.userId).toBeUndefined()
  })
})

describe('test getting created tasks', () => {
  it("20. You can't get a list of tasks without a user id.", async () => {
    expect.assertions(1)

    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.user = {}

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(index, req, saveRes)
    expect(saveRes.statusCode).toBe(401)
  })

  it("21. If you use user1's id, the call returns a 200 status.", async () => {
  })
})

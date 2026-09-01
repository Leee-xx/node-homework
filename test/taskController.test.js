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

  user1 = await prisma.User.create({
    data: {
      name: 'Bob',
      email: 'bob@sample.com',
      hashedPassword: 'nonsense',
    },
  })

  user2 = await prisma.User.create({
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
    const req = httpMocks.createRequest({
      method: 'GET',
    })

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(index, req, saveRes)
    expect(saveRes.statusCode).toBe(401)
  })

  it("21. If you use user1's id, the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.user = user1

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(index, req, saveRes)
    expect(saveRes.statusCode).toBe(200)
  })

  it('22. The returned object has a tasks array of length 1.', () => {
    saveData = saveRes._getJSONData()
    expect(saveData.tasks.length).toBe(1)
  })

  it('23. The title in the first array object is as expected.', () => {
    expect(saveData.tasks[0].title).toBe(validTitle)
  })

  it('24. The first array object does not contain a userId.', () => {
    expect(saveData.tasks[0].userId).toBeUndefined()
  })

  it('25. If you get the list of tasks using the userId from user2, you get a 404.', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.user = user2

    saveRes = createResponse()

    expect.assertions(1)
    await waitForRouteHandlerCompletion(index, req, saveRes)
    expect(saveRes.statusCode).toBe(404)
  })

  it('26. You can retrieve the created task using show().', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.params = { id: saveTaskId.toString() }
    req.user = user1

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(show, req, saveRes)
    expect(saveRes.statusCode).toBe(200)
  })

  it("27. User2 can't retrieve this task entry. You should get a 404.", async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.params = { id: saveTaskId.toString() }
    req.user = user2

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(show, req, saveRes)
    expect(saveRes.statusCode).toBe(404)
  })

  it('28. User1 can set the task corresponding to saveTaskId to isCompleted: true.', async () => {
    const req = httpMocks.createRequest({
      method: 'PATCH',
    })
    req.params = { id: saveTaskId.toString() }
    req.body = { isCompleted: true }
    req.user = user1

    saveRes = createResponse()
    await waitForRouteHandlerCompletion(update, req, saveRes)
    saveData = saveRes._getJSONData()
    expect(saveData.isCompleted).toBe(true)
  })

  it("29. User2 can't do this.", async () => {
    const req = httpMocks.createRequest({
      method: 'PATCH',
    })
    req.params = { id: saveTaskId.toString() }
    req.body = { isCompleted: true }
    req.user = user2

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(update, req, saveRes)
    expect(saveRes.statusCode).toBe(404)
  })

  it("30. User2 can't delete this task.", async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
    })
    req.params = { id: saveTaskId.toString() }
    req.user = user2

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(deleteTask, req, saveRes)
    expect(saveRes.statusCode).toBe(404)
  })

  it('31. User1 can delete this task.', async () => {
    const req = httpMocks.createRequest({
      method: 'DELETE',
    })
    req.params = { id: saveTaskId.toString() }
    req.user = user1

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(deleteTask, req, saveRes)
    expect(saveRes.statusCode).toBe(200)
  })

  it("32. Retrieving user1's tasks now returns a 404.", async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
    })
    req.params = { id: saveTaskId.toString() }
    req.user = user1

    saveRes = createResponse()

    await waitForRouteHandlerCompletion(show, req, saveRes)
    expect(saveRes.statusCode).toBe(404)
  })
})

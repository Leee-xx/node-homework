const { userSchema } = require('../validation/userSchema')
const { taskSchema, patchTaskSchema } = require('../validation/taskSchema')

const title = 'a valid title'
const isCompleted = false
const priority = 'medium'

const validateSchemaParams = (schema, params) => {
  const { error } = schema.validate(
    params,
    { abortEarly: false },
  )

  return error
}
const getErrorDetail = (err, key) => err.details.find(d => d.context.key === key)

describe('user object validation tests', () => {
  const validateUserParams = (params) => validateSchemaParams(userSchema, params)

  const password = 'Password123!'
  const email = 'bob@sample.com'
  const name = 'Bob'

  it("1. doesn't permit a trivial password", () => {
    const error = validateUserParams({
      name,
      email,
      password: 'password',
    })
    expect(getErrorDetail(error, 'password')).toBeDefined()
  })

  it('2. The user schema requires that an email be specified.', () => {
    const error = validateUserParams({
      name,
      password,
    })

    expect(getErrorDetail(error, 'email')).toBeDefined()
  })

  it('3. The user schema does not accept an invalid email.', () => {
    const error = validateUserParams({
      name,
      password,
      email: 'test',
    })

    expect(getErrorDetail(error, 'email')).toBeDefined()
  })

  it('4. The user schema requires a password.', () => {
    const error = validateUserParams({
      name,
      email,
    })

    expect(getErrorDetail(error, 'password')).toBeDefined()
  })

  it('5. The user schema requires name.', () => {
    const error = validateUserParams({
      password,
      email,
    })

    expect(getErrorDetail(error, 'name')).toBeDefined()
  })

  it('6. The name must be valid (3 to 30 characters).', () => {
    const error = validateUserParams({
      password,
      email,
      name: 'bo',
    })

    expect(getErrorDetail(error, 'name')).toBeDefined()
  })

  it('7. If validation is performed on a valid user object, error comes back falsy.', () => {
    const error = validateUserParams({
      password,
      email,
      name,
    })

    expect(error).toBeFalsy()
  })
})

describe('task object validation tests', () => {
  const validateTaskParams = (params) => validateSchemaParams(taskSchema, params)

  it('8. The task schema requires a title.', () => {
    const error = validateTaskParams({
      isCompleted,
      priority,
    })

    expect(getErrorDetail(error, 'title')).toBeDefined()
  })

  it('9. If an isCompleted value is specified, it must be valid.', () => {
    const error = validateTaskParams({
      title,
      isCompleted: 'bad value',
      priority,
    })

    expect(getErrorDetail(error, 'isCompleted')).toBeDefined()
  })

  it('10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.', () => {
    const { value, error } = taskSchema.validate(
      {
        title,
        priority,
      },
      { abortEarly: false },
    )

    expect(value.isCompleted).toBe(false)
  })

  it('11. If isCompleted in the provided object has the value true, it remains true after validation.', () => {
    const { value, error } = taskSchema.validate(
      {
        title,
        isCompleted: true,
      },
      { abortEarly: false },
    )

    expect(error).toBeFalsy()
    expect(value.isCompleted).toBe(true)
  })
})

describe('patchTask object validation tests', () => {
  it('12. The patchTaskSchema does not require a title.', () => {
    const { value, error } = patchTaskSchema.validate(
      {
        isCompleted,
      },
      { abortEarly: false },
    )

    expect(error).toBeFalsy()
  })

  it('13. If no value is provided for isCompleted this remains undefined in the returned value.', () => {
    const { value, error } = patchTaskSchema.validate(
      {
        title,
      },
      { abortEarly: false },
    )

    expect(value.isCompleted).toBeUndefined()
  })
})

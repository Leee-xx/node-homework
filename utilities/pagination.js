const { paginateSchema } = require('../validation/paginateSchema')

function getPaginationQueryParams(query) {
  const { value, error } = paginateSchema.validate(query)

  if (error) throw error

  return value
}

function paginate(query, totalCount) {
  const { page, limit } = getPaginationQueryParams(query)
  const pageCount = Math.ceil(totalCount / limit)

  return {
    page,
    limit,
    total: totalCount,
    pages: pageCount,
    hasNext: page < pageCount,
    hasPrev: page > 1,
  }
}

function getPaginationSkip(page, limit) {
  return (page - 1) * limit
}

module.exports = {
  getPaginationQueryParams,
  paginate,
  getPaginationSkip,
}

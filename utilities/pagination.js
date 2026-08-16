function getPaginationQueryParams(query) {
  const page = query.page || 1
  const limit = query.limit || 10

  return { page, limit }
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

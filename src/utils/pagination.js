const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Lê ?page e ?limit da query string e calcula o offset.
 */
function getPagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  return { page, limit, offset: (page - 1) * limit };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getPagination, paginatedResponse };

/**
 * Monta uma cláusula WHERE parametrizada a partir de pares [condição, valor].
 * Use "?" na condição como placeholder; filtros com valor vazio são ignorados.
 *
 * Ex.: buildWhere([['e.title ILIKE ?', '%node%'], ['e.date >= ?', undefined]])
 *   -> { where: 'WHERE e.title ILIKE $1', params: ['%node%'] }
 */
function buildWhere(filters) {
  const conditions = [];
  const params = [];

  for (const [condition, value] of filters) {
    if (value === undefined || value === null || value === '') continue;
    params.push(value);
    conditions.push(condition.replace('?', `$${params.length}`));
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

module.exports = { buildWhere };

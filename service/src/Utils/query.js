/* eslint-disable prettier/prettier */
//Remove queries with empty value
export function normalizeQueries(queries = []) {
  let aQueries = [];
  for (let query of queries) {
    if (query.value !== '') {
      aQueries.push(query);
    }
  }
  return aQueries;
}
export function setQuery(querys = []) {
  let query = '',
    i = 0;

  for (let item of querys) {
    if (typeof item.operator !== 'undefined') {
      switch (item.operator) {
        case '$like':
        case '$iLike':
          query += `&${item.field || 'A'}[${item.operator}]=${item.value}%`;
          break;
        case '$or':
          query += `&$or[${i}][${item.field || 'A'}]=${item.value}`;
          i++;
          break;
        case '$or_opt':
          query += `&$or[${i}][${item.field || 'A'}][${item.suboperator}]=${
            item.value
          }`;
          i++;
          break;
        case '=':
        case '$equals':
          query += `&${item.field || 'A'}=${item.value}`;
          break;
        case '$select':
          query += `&${item.field}[]=${item.value}`;
          break;
        case '$sort':
          query += `&${item.operator}[${item.field}]=${item.value}`;
          break;
        case '$in':
          query += `&${
            Array.isArray(item.value)
              ? item.value.map(
                (val, index) => `${item.field}[${item.operator}][${index}]=${val}`
              ).join('&')
              : `${item.field}[${item.operator}]=${item.value}`
          }`;
          break;
        default:
          query += `&${item.field || 'A'}[${item.operator}]=${
            item.type === 'date' ? item.value.toISOString() : item.value
          }`;
      }
    } else {
      query += `&${item.field || 'A'}=${item.value}`;
    }
  }

  return query;
}

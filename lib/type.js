/**
 * Module dependencies
 */

var isArray = Array.isArray

/**
 * Export `type`
 */

module.exports = type

/**
 * Get the type
 *
 * @param {Mixed} v
 * @return {String}
 */

function type(v) {
  return isArray(v)
    ? 'array'
    : v && v.vo
    ? 'vo'
    : v && v.catch
    ? 'catch'
    : v === null
    ? 'null'
    : typeof v
}

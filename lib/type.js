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
    : v && v.__catch__
    ? 'catch'
    : v && v.vo
    ? 'vo'
    : v && typeof v.next === 'function' && typeof v.throw === 'function'
    ? 'generator'
    : v && typeof v.then === 'function' && typeof v.catch === 'function'
    ? 'promise'
    : v === null
    ? 'null'
    : typeof v
}

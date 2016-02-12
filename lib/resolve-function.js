/**
 * Module Dependencies
 */

var wrapped = require('wrapped');

/**
 * Export `resolve_function`
 */

module.exports = resolve_function;

/**
 * Resolve a function (sync or async),
 * generator, or promise
 *
 * @param {Function|Generator|Promise} fn
 * @return {Function}
 */

function resolve_function (fn, options) {
  return function _resolve_function (args, done) {
    wrapped(fn).apply()
  }
}

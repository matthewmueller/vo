/**
 * Module Dependencies
 */

var wrapped = require('wrapped');
var slice = require('sliced');

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

function resolve_function(fn) {
  var wrap = wrapped(fn);

  function _resolve_function(args, done) {
    wrap.apply(this, args.concat(function(err) {
      if (err) done.apply(null, [err].concat(args));
      else done.apply(null, arguments);
    }));
  }

  // point to wrapped fn
  _resolve_function.original = fn;

  return _resolve_function;
}

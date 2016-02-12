/**
 * Module Dependencies
 */

var resolve_function = require('./resolve-function');
var resolve_vo = require('./resolve-vo');
var foreach = require('foreach');
var slice = require('sliced');
var wrap = require('wrapped');
var type = require('./type');
var isArray = Array.isArray;

/**
 * Export `resolve`
 */

module.exports = resolve;

/**
 * Resolve an object/array recursively (sync)
 *
 * @param {Object|Array} obj
 * @return {Function}
 */

function resolve(obj) {
  var is_array = isArray(obj);

  return function _resolve(args, done) {
    var parallel = {};
    var pending = 0;
    var out = {};

    // map out the parallel functions first
    foreach(obj, function(v, k) {
      switch(type(v)) {
        case 'function':
          parallel[k] = resolve_function(v);
          pending++;
          break;
        case 'array':
          parallel[k] = resolve(v);
          pending++;
          break;
        case 'object':
          parallel[k] = resolve(v);
          pending++;
          break;
        case 'vo':
          parallel[k] = resolve_vo(v);
          pending++;
          break;
        default:
          out[k] = v;
      }
    });

    // make the requests
    foreach(parallel, function(fn, k) {
      if (!fn) return next();
      fn(args, next);

      function next (err, args) {
        if (err) return done(err);
        out[k] = args.length === 1 ? args[0] : args;
        if (!--pending) return done(null, out);
      }
    })
  }
}

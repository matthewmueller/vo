/**
 * Module Dependencies
 */

var resolve_function = require('./resolve-function');
var resolve_vo = require('./resolve-vo');
var foreach = require('foreach');
var slice = require('sliced');
var wrap = require('wrapped');
var type = require('./type');

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

function resolve(obj, options) {
  return function _resolve(args, done) {
    var parallel = {};
    var pending = 0;
    var out = {};

    // map out the parallel functions first
    foreach(obj, function(v, k) {
      var t = type(v);

      switch(t) {
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
    foreach(parallel, function(v, k) {
      if (!v) return;
      v(args, response);

      function response(err) {
        if (err && options.catch) return caught.apply(null, arguments);
        else if (err) return done(err);
        next(slice(arguments, 1));
      }

      function caught(err) {
        err.upstream = slice(arguments, 1);
        wrap(options.catch, function(err) {
          if (err) {
            // TODO: fix up, right now prevents double onerror callbacks
            err._skip = true;
            return done(err);
          }

          next(slice(arguments, 1));
        })(err);
      }

      function next(args) {
        out[k] = args.length === 1 ? args[0] : args;
        if (!--pending) return done(null, out);
      }
    });
  }
}

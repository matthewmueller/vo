/**
 * Module Dependencies
 */

var is_generator_function = require('is-generator').fn;
var resolve_function = require('./resolve-function');
var resolve_vo = require('./resolve-vo');
var resolve = require('./resolve');
var slice = require('sliced');
var type = require('./type');

/**
 * Export `series`
 */

module.exports = series;

/**
 * Run the array in series
 *
 * @param {Array} pipeline
 * @param {Array} args
 * @param {Function} done
 */

function series(pipeline, args, options, done) {
  options.arity = args.length;

  var check_arity = options.fixed || !options.transform;
  var fns = pipeline.map(seed(options));

  var first = fns.shift();
  if (!first) return done(null, args);
  first(args, next);

  function next(err, return_args) {
    var return_args = options.transform ? return_args : args
    var try_arity = err && check_arity;

    if (try_arity) {
      // loop over the rest of the functions,
      // to check if an 'err' parameter is first
      do {
        var fn = fns.shift();
      } while (fn && error_handler(fn.original, options.arity));

      // if so, call it with the same arguments we passed in
      if (fn) {
        return fn([err].concat(args), function(err, return_args) {
          if (err) return next(err, args)
          return next(null, return_args)
        });
      }
    }

    if (err) {
      return done(err, args);
    }

    var fn = fns.shift();
    if (!fn) {
      return done(null, return_args);
    } else {
      fn(return_args, next);
    }
  }
}

/**
 * Error handler
 */

function error_handler(fn, arity) {
  if (is_generator_function(fn)) {
    return fn.length <= arity
  } else {
    return fn.length <= arity + 1
  }
}

/**
 * Seed the initial values
 *
 * @param {Mixed} v
 * @return {Function}
 */

function seed(options) {
  return function _seed(v) {
    var t = type(v);

    switch(t) {
      case 'function': return resolve_function(v, options);
      case 'object': return resolve(v, options);
      case 'array': return resolve(v, options);
      case 'vo': return resolve_vo(v, options);
      default: return function(args, done) { return done() };
    }
  }
}

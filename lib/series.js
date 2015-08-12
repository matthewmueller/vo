/**
 * Module Dependencies
 */

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
  var check_arity = options.fixed || !options.transform;
  var fns = pipeline.map(seed(options));
  var arity = options.arity;

  var first = fns.shift();
  if (!first) return done(null, args);
  first(args, response);

  function response(err) {
    var return_args = options.transform ? slice(arguments, 1) : args;
    var catch_error = err && options.catch;
    var try_arity = err && check_arity;

    // check if there's any more functions that
    // support handling errors
    if (try_arity) {
      console.log('trying arity');
      return;
    }

    // no handlers, catch the error and try to recover
    if (catch_error) {
      // call the catch function on the error + return arguments
      var ctx = { arguments: slice(arguments, 1) };
      options.catch.call(ctx, err, function(err) {
        // pass the error and the inputs through
        if (err) return done.apply(this, [err].concat(args));
        // pass the catch function's return arguments to the next stage
        return next(slice(arguments, 1))
      })
      return;
    }

    // nothing to catch, skip the remaining
    // pipeline and return the error
    if (err) {
      return done(err, return_args);
    }

    // pass the arguments on to the next function
    next(return_args);
  }

  // function response(err) {
  //   if (err) {
  //     if (arity) {
  //       // loop over the rest of the functions,
  //       // to check if an 'err' parameter is first
  //       do {
  //         var fn = fns.shift();
  //       } while (fn && fn.original.length <= arity);
  //       // if so, call it
  //       if (fn) return next(arguments, fn);
  //     }

  //     if (options.catch && !err._skip) {
  //       return caught.apply(null, arguments);
  //     } else {
  //       return done (err);
  //     }
  //   } else {
  //     var params = options.transform ? slice(arguments, 1, arity || arguments.length) : args;
  //     next(params);
  //   }
  // }

  // function caught(err) {
  //   err.upstream = slice(arguments, 1);
  //   wrap(options.catch, function(err) {
  //     if (err) return done(err);
  //     next(slice(arguments, 1, arity || arguments.length));
  //   })(err);
  // }

  function next(v, fn) {
    fn = fn || fns.shift();
    if (!fn) return done(null, v);
    fn(v, response);
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
      case 'function': return resolve_function(v);
      case 'object': return resolve(v, options);
      case 'array': return resolve(v, options);
      case 'vo': return resolve_vo(v);
      default: return function(args, done) { return done() };
    }
  }
}

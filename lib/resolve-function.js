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

function resolve_function(fn, options) {
  var wrap = wrapped(fn);

  function _resolve_function(args, done) {
    wrap.apply(this, args.concat(response));

    function response(err) {
      var catch_error = err && !err.bubbling && options.catch;
      var return_args = slice(arguments, 1);

      // no handlers, catch the error and try to recover
      // if (catch_error) {
      //   // call the catch function on the error + return arguments
      //   var ctx = { arguments: args };
      //   options.catch.call(ctx, err, function(e) {
      //     // pass the error and the inputs through
      //     if (e) {
      //       return next(e, args);
      //     }
      //     // pass the catch function's return arguments to the next stage
      //     return next(null, slice(arguments, 1))
      //   })
      //   return;
      // }

      // nothing to catch, skip the remaining
      // pipeline and return the error
      if (err) {
        return next(err, return_args);
      }

      // pass the arguments on to the next function
      next(null, return_args);
    }

    function next (err, args) {
      if (options.fixed) args = args.slice(0, options.arity);
      done(err, args)
    }
  }

  // point to wrapped fn
  _resolve_function.original = fn;

  return _resolve_function;
}

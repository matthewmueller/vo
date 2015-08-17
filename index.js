'use strict';

/**
 * Module Dependencies
 */

var series = require('./lib/series')
var wrapped = require('wrapped');
var foreach = require('foreach');
var sliced = require('sliced');
var isArray = Array.isArray;
var noop = function () {};
var keys = Object.keys;

/**
 * Module Exports
 */

module.exports = Vo;

/**
 * Initialize a `Vo` instance
 *
 * @param {Array|Object|Function, ...}
 * @return {Function}
 */

function Vo() {
  var pipeline = sliced(arguments);

  var options = {
    transform: true,
    fixed: false,
    catch: false
  };

  function vo() {
    var args = sliced(arguments);
    var last = args[args.length - 1];

    if (typeof last === 'function') {
      var done = args.pop();
      start(args, done);
    } else {
      // curry
      return function curry (done) {
        start(args, done);
      };
    }

    function start(args, done) {
      series(pipeline, args, options, function(err, v) {
        if (err) return done(err);
        return done.apply(this, [null].concat(v));
      });
    }
  }

  /**
   * Catch errors
   *
   * @param {Function} fn
   * @return {Vo}
   */

  // vo.catch = function(fn) {
  //   options.catch = 'boolean' == typeof fn ? noop : wrapped(fn);
  //   return vo;
  // }

  /**
   * Transform support
   *
   * @param {Boolean} pipeline
   * @return {Vo}
   */

  vo.transform = function(transform) {
    options.transform = !!transform;
    return vo;
  };

  /**
   * Fix the number of arguments
   * you can pass in. Disabled
   * by default
   *
   * @param {Boolean} fixed
   * @return {Vo}
   */

  vo.fixed = function(fixed) {
    options.fixed = !!fixed;
    return vo;
  };

  // with "vo instanceof Vo"
  vo.vo = true;

  return vo;
}

/**
 * Resolve a function (sync or async),
 * generator, or promise
 *
 * @param {Function|Generator|Promise} fn
 * @return {Function}
 */

// function resolve_function(fn) {
//   function _resolve_function(args, done) {
//     wrap(fn, function(err) {
//       if (err) done.apply(null, [err].concat(args));
//       else done.apply(null, arguments);
//     }).apply(null, args);
//   }

//   // point to wrapped fn
//   _resolve_function.original = fn;

//   return _resolve_function;
// }

// /**
//  * Resolve an object/array recursively (sync)
//  *
//  * @param {Object|Array} obj
//  * @return {Function}
//  */

// function resolve(obj, options) {
//   return function _resolve(args, done) {
//     var parallel = {};
//     var pending = 0;
//     var out = {};

//     // map out the parallel functions first
//     foreach(obj, function(v, k) {
//       var t = type(v);

//       switch(t) {
//         case 'function':
//           parallel[k] = resolve_function(v);
//           pending++;
//           break;
//         case 'array':
//           parallel[k] = resolve(v);
//           pending++;
//           break;
//         case 'object':
//           parallel[k] = resolve(v);
//           pending++;
//           break;
//         case 'vo':
//           parallel[k] = resolve_vo(v);
//           pending++;
//           break;
//         default:
//           out[k] = v;
//       }
//     });

//     // make the requests
//     foreach(parallel, function(v, k) {
//       if (!v) return;
//       v(args, response);

//       function response(err) {
//         if (err && options.catch) return caught.apply(null, arguments);
//         else if (err) return done(err);
//         next(sliced(arguments, 1));
//       }

//       function caught(err) {
//         err.upstream = sliced(arguments, 1);
//         wrap(options.catch, function(err) {
//           if (err) {
//             // TODO: fix up, right now prevents double onerror callbacks
//             err._skip = true;
//             return done(err);
//           }

//           next(sliced(arguments, 1));
//         })(err);
//       }

//       function next(args) {
//         out[k] = args.length === 1 ? args[0] : args;
//         if (!--pending) return done(null, out);
//       }
//     });
//   }
// }

// /**
//  * Get the type
//  *
//  * @param {Mixed} v
//  * @return {String}
//  */

// function type(v) {
//   return isArray(v)
//     ? 'array'
//     : v && v.vo
//       ? 'vo'
//       : typeof v;
// }

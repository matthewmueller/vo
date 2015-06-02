'use strict';

/**
 * Module Dependencies
 */

var foreach = require('foreach');
var sliced = require('sliced');
var wrap = require('wrap-fn');
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
    pipeline: true,
    catch: false
  };

  function vo() {
    var args = sliced(arguments);
    var last = args[args.length - 1];

    if (typeof last === 'function') {
      var done = args.pop();
      start(args, done);
    } else {
      return curry;
    }

    function curry(done) {
      start(args, done);
    }

    function start(args, done) {
      series(pipeline, args, options, function(err, v) {
        if (err) return done(err);
        return done(null, v);
      });
    }
  }

  /**
   * Catch errors
   *
   * @param {Function} fn
   * @return {Vo}
   */

  vo.catch = function(fn) {
    options.catch = 'boolean' == typeof fn ? noop : fn;
    return vo;
  }

  /**
   * Pipeline/Middleware support
   *
   * @param {Boolean} pipeline
   * @return {Vo}
   */

  vo.pipeline = function(pipeline) {
    options.pipeline = !!pipeline;
    return vo;
  };

  // TODO: would love to replace this
  // with "vo instanceof Vo"
  vo.vo = true;

  return vo;
}

/**
 * Run the array in series
 *
 * @param {Array} pipeline
 * @param {Array} args
 * @param {Function} done
 */

function series(pipeline, args, options, done) {
  var pending = pipeline.length;
  var fns = pipeline.map(seed(options));
  var first = fns.shift();
  var ret = [];

  first(args, response);

  function response(err) {
    if (err && options.catch && !err._skip) return caught.apply(null, arguments);
    else if (err) return done(err);
    next(sliced(arguments, 1));
  }

  function caught(err) {
    err.upstream = sliced(arguments, 1);
    wrap(options.catch, function(err) {
      if (err) return done(err);
      next(sliced(arguments, 1));
    })(err);
  }

  function next(v) {
    var fn = fns.shift();
    if (!fn) return done(null, v.length === 1 ? v[0] : v);
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

/**
 * Resolve an inner `Vo` instance
 *
 * @param {Vo} vo
 * @return {Function}
 */

function resolve_vo(vo) {
  return function _resolve_vo(args, done) {
    return vo.apply(null, args.concat(function(err) {
      if (err) done.apply(null, [err].concat(args));
      else done.apply(null, arguments);
    }));
  }
}

/**
 * Resolve a function (sync or async),
 * generator, or promise
 *
 * @param {Function|Generator|Promise} fn
 * @return {Function}
 */

function resolve_function(fn) {
  return function _resolve_function(args, done) {
    wrap(fn, function(err) {
      if (err) done.apply(null, [err].concat(args));
      else done.apply(null, arguments);
    }).apply(null, args);
  }
}

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
        next(sliced(arguments, 1));
      }

      function caught(err) {
        err.upstream = sliced(arguments, 1);
        wrap(options.catch, function(err) {
          if (err) {
            // TODO: fix up, right now prevents double onerror callbacks
            err._skip = true;
            return done(err);
          }

          next(sliced(arguments, 1));
        })(err);
      }

      function next(args) {
        out[k] = args.length === 1 ? args[0] : args;
        if (!--pending) return done(null, out);
      }
    });
  }
}

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
      : typeof v;
}

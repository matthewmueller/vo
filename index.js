'use strict';

/**
 * Module Dependencies
 */

var foreach = require('foreach');
var sliced = require('sliced');
var wrap = require('wrap-fn');
var isArray = Array.isArray;
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
      series(pipeline, args, function(err, v) {
        if (err) return done(err);
        return done(null, v);
      });
    }
  }

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

function series(pipeline, args, done) {
  var pending = pipeline.length;
  var fns = pipeline.map(seed);
  var first = fns.shift();
  var ret = [];

  first(args, next);

  function next(err) {
    if (err) return done(err);
    var v = sliced(arguments, 1);
    var fn = fns.shift();
    if (!fn) return done(null, v.length === 1 ? v[0] : v);
    fn(v, next);
  }
}

/**
 * Seed the initial values
 *
 * @param {Mixed} v
 * @return {Function}
 */

function seed(v) {
  var t = type(v);

  switch(t) {
    case 'function': return resolve_function(v);
    case 'object': return resolve(v);
    case 'array': return resolve(v);
    case 'vo': return resolve_vo(v);
    default: return function(args, done) { return done() };
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
    return vo.apply(null, args.concat(done));
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
    wrap(fn, done).apply(null, args);
  }
}

/**
 * Resolve an object/array recursively
 *
 * @param {Object|Array} obj
 * @return {Function}
 */

function resolve(obj) {
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
      v(args, function(err) {
        if (err) return done(err);
        var ret = sliced(arguments, 1);
        out[k] = ret.length === 1 ? ret[0] : ret;
        if (!--pending) return done(null, out);
      });
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
    : typeOf(v);
}

/**
 * Get the type
 *
 * @param {Mixed} v
 * @return {String}
 */

function typeOf(v) {
  var toString = Object.prototype.toString;
  return toString.call(v).slice(8, -1).toLowerCase();
}

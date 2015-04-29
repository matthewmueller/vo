/**
 * Module Dependencies
 */

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

    // TODO: thunk support
    var done = 'function' == typeof last
      ? args.pop()
      : function() {};

    series(pipeline, args, function(err, v) {
      if (err) return done(err);
      return done(null, v);
    });
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
    if (!fn) return done(null, v.length == 1 ? v[0] : v);
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
    case 'object': return resolve_object(v);
    case 'array': return resolve_array(v);
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
 * Resolve an object recursively
 *
 * @param {Object} obj
 * @return {Function}
 */

function resolve_object(obj) {
  return function _resolve_object(args, done) {
    var parallel = {};
    var pending = 0;
    var out = {};

    // map out the parallel functions first
    keys(obj).forEach(function(k) {
      var v = obj[k];
      var t = type(v);

      switch(t) {
        case 'function':
          parallel[k] = resolve_function(v);
          pending++;
          break;
        case 'array':
          parallel[k] = resolve_array(v);
          pending++;
          break;
        case 'object':
          parallel[k] = resolve_object(v);
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
    keys(parallel).forEach(function(k) {
      var v = parallel[k];
      if (!v) return;
      v(args, function(err) {
        if (err) return done(err);
        var ret = sliced(arguments, 1);
        out[k] = ret.length == 1 ? ret[0] : ret;
        if (!--pending) return done(null, out);
      });
    });
  }
}

/**
 * Resolve an array recursively
 *
 * @param {Array} arr
 * @return {Function}
 */

function resolve_array(arr) {
  return function _resolve_array(args, done) {
    var parallel = [];
    var pending = 0;
    var out = [];

    // map out the parallel functions first
    arr.forEach(function(v, k) {
      var t = type(v);
      var v = arr[k];

      switch(t) {
        case 'function':
          parallel[k] = resolve_function(v);
          pending++;
          break;
        case 'array':
          parallel[k] = resolve_array(v);
          pending++;
          break;
        case 'object':
          parallel[k] = resolve_object(v);
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

    // make the parallel requests
    parallel.forEach(function(v, i) {
      if (!v) return;
      v(args, function(err) {
        if (err) return done(err);
        var ret = sliced(arguments, 1);
        out[i] = ret.length == 1 ? ret[0] : ret;
        if (!--pending) {
          return done(null, out);
        }
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
    : v.vo
    ? 'vo'
    : typeof v;
}

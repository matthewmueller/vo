/**
 * Module Dependencies
 */

var wrapped = require('wrapped')
var slice = require('sliced')
var type = require('./type')
var keys = Object.keys

/**
 * Export `compile`
 */

module.exports = compile

/**
 * Compile
 */

function compile (mixed) {
  switch (type(mixed)) {
    case 'function': return Func(mixed)
    case 'object': return object(mixed)
    case 'array': return array(mixed)
    case 'vo': return Vo(mixed)
    default: return identity
  }
}

/**
 * Wrap functions
 *
 * @param {Function} fn
 * @return {Function}
 */

function Func (fn) {
  return function func (args, done) {
    wrapped(fn).apply(this, args.concat(done))
  }
}

/**
 * Wrap Objects
 *
 * @param {Object|Array} iterable
 * @return {Function}
 */

function object (o) {
  // compile the object
  o = keys(o).reduce(function (o, k) {
    o[k] = compile(o[k])
    return o
  }, o)

  return function obj (args, done) {
    var pending = keys(o).length
    var out = {}

    keys(o).map(function(k, i) {
      o[k](args, function(err, args) {
        if (err) return done(err)
        out[k] = args
        if (!--pending) return done(null, out)
      })
    })
  }
}

/**
 * Wrap Arrays
 */

function array (a) {
  a = a.map(compile)

  return function arr (args, done) {
    var pending = a.length
    var out = []

    // run in parallel
    a.map(function (fn, i) {
      fn(args, function(err, args) {
        if (err) return done(err)
        out[i] = args
        if (!--pending) return done(null, out)
      })
    })
  }
}

/**
 * Wrap vo
 *
 * @param {Vo} vo
 * @return {Function}
 */

function Vo (v) {
  return function vo (args, done) {
    return v.apply(null, args.concat(function(err, v) {
      if (err) return done(err);
      return done.apply(null, arguments);
    }))
  }
}

/**
 * Identity
 *
 * @param {Array} args
 * @param {Function} done
 */

function identity (args, done) {
  return done(null, args)
}


/**
 * Module Dependencies
 */

var error = require('combine-errors')
var wrapped = require('./wrap')
var sliced = require('sliced')
var type = require('./type')
var co = require('co')
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
    case 'generator': return generator(mixed)
    case 'promise': return promise(mixed)
    case 'function': return Func(mixed)
    case 'object': return object(mixed)
    case 'catch': return Catcher(mixed)
    case 'array': return array(mixed)
    case 'vo': return Vo(mixed)
    default: return Identity(mixed)
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
    wrapped(fn, next).call(this, args)

    function next(err) {
      if (err) return done.apply(null, [err].concat(sliced(arguments)))
      return done.apply(null, arguments)
    }
  }
}

/**
 * Handle already pending promises
 *
 * @param {Promise} p
 * @return {Function}
 */

function promise (p) {
  return function prom (args, done) {
    return p
      .then(function (value) { return done(null, value) })
      .catch(function (err) { return done(err) })
  }
}

/**
 * Handle already initialized generators
 *
 * @param {Promise} p
 * @return {Function}
 */

function generator (g) {
  return function gen (args, done) {
    return co(g)(done)
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
    var context = this
    var errors = []
    var out = {}

    // if we don't have any pending
    // values, return immediately
    if (!pending) return done(null, out)

    keys(o).map(function(k, i) {
      o[k].call(context, args, function(err, args) {
        if (err) {
          errors[i] = err
          out[k] = err
        } else {
          out[k] = args
        }

        if (!--pending) {
          errors = compact(errors)
          return errors.length
            ? done(error(errors), out)
            : done(null, out)
        }
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
    var context = this
    var errors = []
    var out = []

    // if we don't have any pending
    // values, return immediately
    if (!pending) return done(null, out)

    // run in parallel
    a.map(function (fn, i) {
      fn.call(context, args, function(err, args) {
        if (err) {
          errors[i] = err
          out[i] = err
        } else {
          out[i] = args
        }

        if (!--pending) {
          errors = compact(errors)
          return errors.length
            ? done(error(errors), out)
            : done(null, out)
        }
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
    return v.apply(this, args.concat(function(err, v) {
      if (err) return done(error(err))
      return done.apply(null, arguments)
    }))
  }
}

/**
 * Catcher
 *
 * @param {Function} fn
 * @return {Function}
 */

function Catcher(fn) {
  function catcher (err, args, done) {
    return wrapped(fn(), done).call(this, [err].concat(args))
  }
  catcher.__catch__ = true
  return catcher
}

/**
 * Identity
 *
 * @param {Array} args
 * @param {Function} done
 */

function Identity (value) {
  return function identity (args, done) {
    return done(null, value)
  }
}

/**
 * Compact
 */

function compact (arr) {
  return arr.filter(function (item) {
    return !!item
  })
}

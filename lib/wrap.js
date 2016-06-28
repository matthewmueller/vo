/**
 * Module Dependencies
 */

var debug = require('debug')('vo')
var sliced = require('sliced')
var noop = function(){}
var co = require('co')

/**
 * Export `wrapped`
 */

module.exports = wrapped

/**
 * Wrap
 */

function wrapped(fn, done) {
  return function wrap(args) {
    var ctx = this

    debug.enabled && debug(pretty(fn.name || 'anonymous', args))

    // nothing
    if (!fn) {
      return next.apply(ctx, [null].concat(args));
    } else if (generator(fn)) {
      return co(fn).apply(ctx, args.concat(next))
    } else {
      return sync(fn, next).apply(ctx, args)
    }

    function next () {
      debug.enabled && debug(pretty(fn.name || 'anonymous', args, sliced(arguments)))
      return done.apply(this, arguments)
    }
  }
}

/**
 * Wrap a synchronous function execution.
 *
 * @param {Function} fn
 * @param {Function} done
 * @return {Function}
 * @api private
 */

function sync(fn, done) {
  return function () {
    var ret;

    try {
      ret = fn.apply(this, arguments);
    } catch (err) {
      return done(err);
    }

    if (promise(ret)) {
      ret.then(function (value) { done(null, value); }, done);
    } else {
      ret instanceof Error ? done(ret) : done(null, ret);
    }
  }
}

/**
 * Is `value` a generator?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function generator(value) {
  return (value && value.constructor && 'GeneratorFunction' == value.constructor.name)
    || (typeof value.next === 'function' && typeof value.throw === 'function')
}

/**
 * Is `value` a promise?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function promise(value) {
  return value && 'function' == typeof value.then;
}

/**
 * Prettify a function
 *
 * @param {String} name
 * @param {Array} args
 * @return {Function}
 */

function pretty (name, inputs, outputs) {
  inputs = inputs.map(function (input) {
    return trim(stringify(input), 30)
  }).join(', ')

  if (outputs) {
    outputs = '{ ' + outputs.map(function (output) {
      return trim(stringify(output), 30)
    }).join(', ') + ' }'
  }

  if (!outputs) {
    return '↗ ' + name + '(' + inputs + ')'
  } else {
    return '↙ ' + name + '(' + inputs + ') = ' + outputs
  }

  function trim (str, limit) {
    if (str.length > limit) {
      return str.slice(0, limit - 3) + '…'
    } else {
      return str
    }
  }

  function stringify (mixed) {
    try {
      return JSON.stringify(mixed)
    } catch (e) {
      return '×'
    }
  }
}

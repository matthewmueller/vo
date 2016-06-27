/**
 * Module Dependencies
 */

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
  return function wrap() {
    var args = sliced(arguments)
    let ctx = this

    // nothing
    if (!fn) {
      return done.apply(ctx, [null].concat(args));
    } else if (generator(fn)) {
      return co(fn).apply(ctx, args.concat(done))
    } else {
      return sync(fn, done).apply(ctx, args)
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
  return value
    && value.constructor
    && 'GeneratorFunction' == value.constructor.name;
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

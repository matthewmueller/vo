/**
 * Module Dependencies
 */

var compile = require('./compile')

/**
 * Export `Stack`
 */

module.exports = Stack

/**
 * Initialize `Stack`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Stack (stack, context, args, done) {
  stack = stack.map(compile)

  // run in stack
  function next (err) {
    if (err) return error(err)
    var fn = stack.shift()
    while (fn && fn.__catch__ === true) fn = stack.shift()
    if (!fn) return done.call(context, null, args)
    fn.call(context, args, next)
  }

  // error handling
  function error (err) {
    var fn = stack.shift()
    while (fn && fn.__catch__ !== true) fn = stack.shift()
    if (fn) return fn.call(context, err, args, next)
    else return done.call(context, err)
  }

  // kick us off
  next()
}

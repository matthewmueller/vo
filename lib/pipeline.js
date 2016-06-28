/**
 * Module Dependencies
 */

var compile = require('./compile')
var sliced = require('sliced')

/**
 * Export `Pipeline`
 */

module.exports = Pipeline

/**
 * Initialize `Pipeline`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Pipeline (pipeline, context, args, done) {
  pipeline = pipeline.map(compile)
  var remaining = args.slice(1)
  var al = args.length || 1

  // run in series
  function next (err) {
    if (err) return error(err, sliced(arguments, 1))
    var fn = pipeline.shift()
    while (fn && fn.__catch__ === true) fn = pipeline.shift()
    var na = sliced(arguments, 1).concat(remaining).slice(0, al)
    if (!fn || exit(na)) return done.call(context, null, na)
    return fn.call(context, na, next)
  }

  // error handling
  function error (err, ca) {
    var fn = pipeline.shift()
    while (fn && fn.__catch__ !== true) fn = pipeline.shift()
    var na = ca.concat(remaining).slice(0, al + 1)
    if (!fn || exit(na)) return done.call(context, err)
    return fn.call(context, err, na, next)
  }

  // kick us off
  next.apply(null, [null].concat(args))
}

/**
 * Early exit
 */

function exit (args) {
  return args.length
    && (typeof args[0] === 'undefined' || args[0] === null)
}

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
    while (fn && fn.catch === true) fn = pipeline.shift()
    var na = sliced(arguments, 1).concat(remaining).slice(0, al)
    if (!fn) return done.call(context, null, na)
    return fn.call(context, na, next)
  }

  // error handling
  function error (err, ca) {
    var fn = pipeline.shift()
    while (fn && fn.catch !== true) fn = pipeline.shift()
    var na = ca.concat(remaining).slice(0, al + 1)
    if (fn) return fn.call(context, err, na, next)
    else return done.call(context, err)
  }

  // kick us off
  next.apply(null, [null].concat(args))
}

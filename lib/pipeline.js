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

  // run in series
  function next (err) {
    if (err) return error(err, sliced(arguments, 1))
    var fn = pipeline.shift()
    while (fn && fn.length !== 2) fn = pipeline.shift()
    if (!fn) return done.call(context, null, sliced(arguments, 1))
    fn.call(context, sliced(arguments, 1), next)
  }

  // error handling
  function error (err, args) {
    var fn = pipeline.shift()
    while (fn && fn.length !== 3) fn = pipeline.shift()
    if (fn) return fn.call(context, err, args, next)
    else return done.call(context, err)
  }

  // kick us off
  next.apply(null, [null].concat(args))
}

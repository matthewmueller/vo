/**
 * Module Dependencies
 */

var compile = require('./compile')
var sliced = require('sliced')

/**
 * Export `Pipeline`
 */

module.exports = Pipeline;

/**
 * Initialize `Pipeline`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Pipeline (pipeline, context, args, done) {
  pipeline = pipeline.map(compile)

  function next (err) {
    if (err) return done(err)
    var fn = pipeline.shift()
    if (!fn) return done.call(context, null, sliced(arguments, 1))
    fn.call(context, sliced(arguments, 1), next)
  }

  // kick us off
  next.apply(null, [null].concat(args))
}

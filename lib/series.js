/**
 * Module Dependencies
 */

var compile = require('./compile')

/**
 * Export `Series`
 */

module.exports = Series

/**
 * Initialize `Series`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Series (series, context, args, done) {
  series = series.map(compile)

  // run in series
  function next (err) {
    if (err) return error(err)
    var fn = series.shift()
    while (fn && fn.length !== 2) fn = series.shift()
    if (!fn) return done.call(context, null, args)
    fn.call(context, args, next)
  }

  // error handling
  function error (err) {
    var fn = series.shift()
    while (fn && fn.length !== 3) fn = series.shift()
    if (fn) return fn.call(context, err, args, next)
    else return done.call(context, err)
  }

  // kick us off
  next()
}

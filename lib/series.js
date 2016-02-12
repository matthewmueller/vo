/**
 * Module Dependencies
 */

var compile = require('./compile')

/**
 * Export `Series`
 */

module.exports = Series;

/**
 * Initialize `Series`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Series (series, context, args, done) {
  series = series.map(compile)

  function next (err) {
    if (err) return done(err)
    var fn = series.shift()
    if (!fn) return done(null, args)
    fn.call(context, args, next)
  }

  // kick us off
  next()
}

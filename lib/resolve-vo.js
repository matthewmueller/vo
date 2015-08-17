/**
 * Module Dependencies
 */

var slice = require('sliced')

/**
 * Export `resolve_vo`
 */

module.exports = resolve_vo;

/**
 * Resolve an inner `Vo` instance
 *
 * @param {Vo} vo
 * @return {Function}
 */

function resolve_vo(vo, options) {
  return function _resolve_vo(args, done) {
    return vo.apply(null, args.concat(function(err) {
      if (err) return done(err, args);
      return done(null, slice(arguments, 1));
    }));
  }
}

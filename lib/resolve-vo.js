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

function resolve_vo(vo) {
  return function _resolve_vo(args, done) {
    return vo.apply(null, args.concat(function(err) {
      if (err) done.apply(null, [err].concat(args));
      else done.apply(null, arguments);
    }));
  }
}

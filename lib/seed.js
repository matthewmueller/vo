/**
 * Module dependencies
 */

var resolve_function = require('./resolve-function')
var resolve_vo = require('./resolve-vo')
var resolve = require('./resolve')
var type = require('./type')

/**
 * Export `seed`
 */

module.exports = seed;

/**
 * seed the initial values
 *
 * @param {Mixed} v
 * @return {Function}
 */

function seed(v) {
  switch(type(v)) {
    case 'function': return resolve_function(v);
    case 'object': return resolve(v);
    case 'array': return resolve(v);
    case 'vo': return resolve_vo(v);
    default: return identity
  }
}

/**
 * Identity
 *
 * @param {Array} args
 * @param {Function} done
 */

function identity (args, done) {
  return done(null, args)
}

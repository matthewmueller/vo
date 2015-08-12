'use strict';

/**
 * Module Dependencies
 */

var series = require('./lib/series');
var foreach = require('foreach');
var slice = require('sliced');
var wrap = require('wrapped');
var isArray = Array.isArray;
var noop = function () {};
var keys = Object.keys;

/**
 * Module Exports
 */

module.exports = Vo;

/**
 * Initialize a `Vo` instance
 *
 * @param {Array|Object|Function, ...}
 * @return {Function}
 */

function Vo() {
  var pipeline = slice(arguments);

  var options = {
    transform: true,
    fixed: false,
    catch: false
  };

  function vo() {
    var args = slice(arguments);
    var last = args[args.length - 1];

    if (typeof last === 'function') {
      var done = args.pop();
      start(args, done);
    } else {
      return function curry (done) {
        start(args, done);
      }
    }

    function start(args, done) {
      options.arity = args.length;
      series(pipeline, args, options, function(err, v) {
        if (err) return done(err);
        return done.apply(this, [null].concat(v));
      });
    }
  }

  /**
   * Catch errors
   *
   * @param {Function} fn
   * @return {Vo}
   */

  vo.catch = function(fn) {
    options.catch = 'boolean' == typeof fn ? noop : wrap(fn);
    return vo;
  }

  /**
   * Transform support
   *
   * @param {Boolean} pipeline
   * @return {Vo}
   */

  vo.transform = function(transform) {
    options.transform = !!transform;
    return vo;
  };

  /**
   * Fix the number of arguments
   * you can pass in. Disabled
   * by default
   *
   * @param {Boolean} fixed
   * @return {Vo}
   */

  vo.fixed = function(fixed) {
    options.fixed = !!fixed;
    return vo;
  };


  // TODO: would love to replace this
  // with "vo instanceof Vo"
  vo.vo = true;

  return vo;
}

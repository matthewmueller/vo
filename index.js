'use strict';

/**
 * Module Dependencies
 */

var Pipeline = require('./lib/pipeline')
var Series = require('./lib/series')
var wrapped = require('wrapped');
var foreach = require('foreach');
var sliced = require('sliced');
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
  var series = isArray(this) ? sliced(this) : sliced(arguments);

  function vo() {
    var args = sliced(arguments);
    var last = args[args.length - 1]
    var context = this

    if (typeof last === 'function') {
      var done = args.pop();
      start(args, done);
    } else {
      // return a promise
      return new Promise(function (success, failure) {
        start(args, function(err, ret) {
          if (arguments.length > 2) ret = sliced(arguments, 1)
          return err ? failure(err) : success(ret)
        })
      })
    }

    function start(args, done) {
      Series(series, context, args, function(err) {
        if (err) return done.call(context, err);
        return done.apply(context, [null].concat(args));
      });
    }
  }

  // with "vo instanceof Vo"
  vo.vo = true;

  return vo;
}

/**
 * Pipeline the functions
 *
 * @param {Mixed}
 * @return {Function}
 */

Vo.pipeline = function pipeline () {
  var pipeline = isArray(this) ? sliced(this) : sliced(arguments);

  function vo () {
    var args = sliced(arguments);
    var last = args[args.length - 1];
    var context = this

    if (typeof last === 'function') {
      var done = args.pop();
      start(args, done);
    } else {
      // return a promise
      return new Promise(function (success, failure) {
        start(args, function(err, value) {
          return err ? failure(err) : success(value)
        })
      })
    }

    function start(args, done) {
      Pipeline(pipeline, context, args, function(err, v) {
        if (err) return done(err);
        return done.apply(this, [null].concat(v));
      });
    }
  }

  // with "vo instanceof Vo"
  vo.vo = true

  return vo
}

/**
 * Catch errors
 *
 * @param {Function} fn
 * @return {Function}
 */

Vo.catch = function (fn) {

}

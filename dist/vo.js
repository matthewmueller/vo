(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

/**
 * Module Dependencies
 */

var Pipeline = require('./lib/pipeline')
// var Promise = require('any-promise')
var Stack = require('./lib/stack')
var sliced = require('sliced')
var isArray = Array.isArray
var noop = function () {}
var keys = Object.keys

/**
 * Module Exports
 */

module.exports = Vo

/**
 * Initialize a `Vo` instance
 *
 * @param {Array|Object|Function, ...}
 * @return {Function}
 */

function Vo() {
  return Vo.pipeline.apply(this, arguments)
}

/**
 * Pipeline the functions
 *
 * @param {Mixed}
 * @return {Function}
 */

Vo.pipeline = function pipeline () {
  var pipeline = isArray(this) ? sliced(this) : sliced(arguments)

  // run vo
  return run(function (context, args, done) {
    Pipeline(pipeline, context, args, function(err, args) {
      if (err) return done.call(context, err)
      return done.apply(context, [null].concat(args))
    })
  })
}

/**
 * Stack the functions (middleware style)
 *
 * @param {Mixed}
 * @return {Function}
 */

Vo.stack = function stack () {
  var stack = isArray(this) ? sliced(this) : sliced(arguments)

  // run the stack
  return run(function (context, args, done) {
    Stack(stack, context, args, function(err, v) {
      if (err) return done(err)
      return done.apply(this, [null].concat(v))
    })
  })
}

/**
 * Compose the functions
 *
 * COMING SOON
 */

Vo.compose = function compose () {
  throw new Error('not implemented yet')
}

/**
 * Simple wrapper that will allow us
 * to switch between fixed arguments
 * and transform pipelines
 *
 * @param {Function} fn
 * @return {Function}
 */

function run (fn) {
  function vo () {
    var args = sliced(arguments)
    var last = args[args.length - 1]
    var context = this

    if (typeof last === 'function') {
      var done = args.pop()
      fn(context, args, done)
    } else {
      // return a promise
      return new Promise(function (success, failure) {
        fn(context, args, function(err, ret) {
          if (arguments.length > 2) ret = sliced(arguments, 1)
          return err ? failure(err) : success(ret)
        })
      })
    }
  }

  // with "vo instanceof Vo"
  vo.vo = true

  // thenable support
  vo.then = function (success, failure) {
    return vo().then(success, failure)
  }

  vo.catch = function (failure) {
    return vo().catch(failure)
  }

  return vo
}

/**
 * Catch errors
 *
 * @param {Function} fn
 * @return {Function}
 */

Vo.catch = function (fn) {
  // simple wrapper to avoid attaching to the passed-in function
  function catcher () { return fn }
  catcher.__catch__ = true
  return catcher
}

},{"./lib/pipeline":3,"./lib/stack":4,"sliced":12}],2:[function(require,module,exports){
/**
 * Module Dependencies
 */

var error = require('combine-errors')
var wrapped = require('./wrap')
var sliced = require('sliced')
var type = require('./type')
var co = require('co')
var keys = Object.keys

/**
 * Export `compile`
 */

module.exports = compile

/**
 * Compile
 */

function compile (mixed) {
  switch (type(mixed)) {
    case 'generator': return generator(mixed)
    case 'promise': return promise(mixed)
    case 'function': return Func(mixed)
    case 'object': return object(mixed)
    case 'catch': return Catcher(mixed)
    case 'array': return array(mixed)
    case 'vo': return Vo(mixed)
    default: return Identity(mixed)
  }
}

/**
 * Wrap functions
 *
 * @param {Function} fn
 * @return {Function}
 */

function Func (fn) {
  return function func (args, done) {
    wrapped(fn, next).call(this, args)

    function next(err) {
      if (err) return done.apply(null, [err].concat(sliced(arguments)))
      return done.apply(null, arguments)
    }
  }
}

/**
 * Handle already pending promises
 *
 * @param {Promise} p
 * @return {Function}
 */

function promise (p) {
  return function prom (args, done) {
    return p
      .then(function (value) { return done(null, value) })
      .catch(function (err) { return done(err) })
  }
}

/**
 * Handle already initialized generators
 *
 * @param {Promise} p
 * @return {Function}
 */

function generator (g) {
  return function gen (args, done) {
    return co(g)(done)
  }
}

/**
 * Wrap Objects
 *
 * @param {Object|Array} iterable
 * @return {Function}
 */

function object (o) {
  // compile the object
  o = keys(o).reduce(function (o, k) {
    o[k] = compile(o[k])
    return o
  }, o)

  return function obj (args, done) {
    var pending = keys(o).length
    var context = this
    var errors = []
    var out = {}

    // if we don't have any pending
    // values, return immediately
    if (!pending) return done(null, out)

    keys(o).map(function(k, i) {
      o[k].call(context, args, function(err, args) {
        if (err) {
          errors[i] = err
          out[k] = err
        } else {
          out[k] = args
        }

        if (!--pending) {
          errors = compact(errors)
          return errors.length
            ? done(error(errors), out)
            : done(null, out)
        }
      })
    })
  }
}

/**
 * Wrap Arrays
 */

function array (a) {
  a = a.map(compile)

  return function arr (args, done) {
    var pending = a.length
    var context = this
    var errors = []
    var out = []

    // if we don't have any pending
    // values, return immediately
    if (!pending) return done(null, out)

    // run in parallel
    a.map(function (fn, i) {
      fn.call(context, args, function(err, args) {
        if (err) {
          errors[i] = err
          out[i] = err
        } else {
          out[i] = args
        }

        if (!--pending) {
          errors = compact(errors)
          return errors.length
            ? done(error(errors), out)
            : done(null, out)
        }
      })
    })
  }
}

/**
 * Wrap vo
 *
 * @param {Vo} vo
 * @return {Function}
 */

function Vo (v) {
  return function vo (args, done) {
    return v.apply(this, args.concat(function(err, v) {
      if (err) return done(error(err))
      return done.apply(null, arguments)
    }))
  }
}

/**
 * Catcher
 *
 * @param {Function} fn
 * @return {Function}
 */

function Catcher(fn) {
  function catcher (err, args, done) {
    return wrapped(fn(), done).call(this, [err].concat(args))
  }
  catcher.__catch__ = true
  return catcher
}

/**
 * Identity
 *
 * @param {Array} args
 * @param {Function} done
 */

function Identity (value) {
  return function identity (args, done) {
    return done(null, value)
  }
}

/**
 * Compact
 */

function compact (arr) {
  return arr.filter(function (item) {
    return !!item
  })
}

},{"./type":5,"./wrap":6,"co":7,"combine-errors":8,"sliced":12}],3:[function(require,module,exports){
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
    while (fn && fn.__catch__ === true) fn = pipeline.shift()
    var na = sliced(arguments, 1).concat(remaining).slice(0, al)
    if (!fn || exit(na)) return done.call(context, null, na)
    return fn.call(context, na, next)
  }

  // error handling
  function error (err, ca) {
    var fn = pipeline.shift()
    while (fn && fn.__catch__ !== true) fn = pipeline.shift()
    var na = ca.concat(remaining).slice(0, al + 1)
    if (!fn || exit(na)) return done.call(context, err)
    return fn.call(context, err, na, next)
  }

  // kick us off
  next.apply(null, [null].concat(args))
}

/**
 * Early exit
 */

function exit (args) {
  return args.length
    && (typeof args[0] === 'undefined' || args[0] === null)
}

},{"./compile":2,"sliced":12}],4:[function(require,module,exports){
/**
 * Module Dependencies
 */

var compile = require('./compile')

/**
 * Export `Stack`
 */

module.exports = Stack

/**
 * Initialize `Stack`
 *
 * @param {Array} series array of functions
 * @param {Array} args
 * @param {Function} done
 */

function Stack (stack, context, args, done) {
  stack = stack.map(compile)

  // run in stack
  function next (err) {
    if (err) return error(err)
    var fn = stack.shift()
    while (fn && fn.__catch__ === true) fn = stack.shift()
    if (!fn) return done.call(context, null, args)
    fn.call(context, args, next)
  }

  // error handling
  function error (err) {
    var fn = stack.shift()
    while (fn && fn.__catch__ !== true) fn = stack.shift()
    if (fn) return fn.call(context, err, args, next)
    else return done.call(context, err)
  }

  // kick us off
  next()
}

},{"./compile":2}],5:[function(require,module,exports){
/**
 * Module dependencies
 */

var isArray = Array.isArray

/**
 * Export `type`
 */

module.exports = type

/**
 * Get the type
 *
 * @param {Mixed} v
 * @return {String}
 */

function type(v) {
  return isArray(v)
    ? 'array'
    : v && v.__catch__
    ? 'catch'
    : v && v.vo
    ? 'vo'
    : v && typeof v.next === 'function' && typeof v.throw === 'function'
    ? 'generator'
    : v && typeof v.then === 'function' && typeof v.catch === 'function'
    ? 'promise'
    : v === null
    ? 'null'
    : typeof v
}

},{}],6:[function(require,module,exports){
/**
 * Module Dependencies
 */

var debug = require('debug')('vo')
var sliced = require('sliced')
var noop = function(){}
var co = require('co')

/**
 * Export `wrapped`
 */

module.exports = wrapped

/**
 * Wrap
 */

function wrapped(fn, done) {
  return function wrap(args) {
    var ctx = this

    debug.enabled && debug(pretty(fn.name || 'anonymous', args))

    // nothing
    if (!fn) {
      return next.apply(ctx, [null].concat(args));
    } else if (generator(fn)) {
      return co(fn).apply(ctx, args.concat(next))
    } else {
      return sync(fn, next).apply(ctx, args)
    }

    function next () {
      debug.enabled && debug(pretty(fn.name || 'anonymous', args, sliced(arguments)))
      return done.apply(this, arguments)
    }
  }
}

/**
 * Wrap a synchronous function execution.
 *
 * @param {Function} fn
 * @param {Function} done
 * @return {Function}
 * @api private
 */

function sync(fn, done) {
  return function () {
    var ret;

    try {
      ret = fn.apply(this, arguments);
    } catch (err) {
      return done(err);
    }

    if (promise(ret)) {
      ret.then(function (value) { done(null, value); }, done);
    } else {
      ret instanceof Error ? done(ret) : done(null, ret);
    }
  }
}

/**
 * Is `value` a generator?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function generator(value) {
  return (value && value.constructor && 'GeneratorFunction' == value.constructor.name)
    || (typeof value.next === 'function' && typeof value.throw === 'function')
}

/**
 * Is `value` a promise?
 *
 * @param {Mixed} value
 * @return {Boolean}
 * @api private
 */

function promise(value) {
  return value && 'function' == typeof value.then;
}

/**
 * Prettify a function
 *
 * @param {String} name
 * @param {Array} args
 * @return {Function}
 */

function pretty (name, inputs, outputs) {
  inputs = inputs.map(function (input) {
    return trim(stringify(input), 30)
  }).join(', ')

  if (outputs) {
    outputs = '{ ' + outputs.map(function (output) {
      return trim(stringify(output), 30)
    }).join(', ') + ' }'
  }

  if (!outputs) {
    return '↗ ' + name + '(' + inputs + ')'
  } else {
    return '↙ ' + name + '(' + inputs + ') = ' + outputs
  }

  function trim (str, limit) {
    if (str.length > limit) {
      return str.slice(0, limit - 3) + '…'
    } else {
      return str
    }
  }

  function stringify (mixed) {
    try {
      return JSON.stringify(mixed)
    } catch (e) {
      return '×'
    }
  }
}

},{"co":7,"debug":9,"sliced":12}],7:[function(require,module,exports){

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

module.exports = co;

/**
 * Wrap the given generator `fn` and
 * return a thunk.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function co(fn) {
  var isGenFun = isGeneratorFunction(fn);

  return function (done) {
    var ctx = this;

    // in toThunk() below we invoke co()
    // with a generator, so optimize for
    // this case
    var gen = fn;

    // we only need to parse the arguments
    // if gen is a generator function.
    if (isGenFun) {
      var args = slice.call(arguments), len = args.length;
      var hasCallback = len && 'function' == typeof args[len - 1];
      done = hasCallback ? args.pop() : error;
      gen = fn.apply(this, args);
    } else {
      done = done || error;
    }

    next();

    // #92
    // wrap the callback in a setImmediate
    // so that any of its errors aren't caught by `co`
    function exit(err, res) {
      setImmediate(function(){
        done.call(ctx, err, res);
      });
    }

    function next(err, res) {
      var ret;

      // multiple args
      if (arguments.length > 2) res = slice.call(arguments, 1);

      // error
      if (err) {
        try {
          ret = gen.throw(err);
        } catch (e) {
          return exit(e);
        }
      }

      // ok
      if (!err) {
        try {
          ret = gen.next(res);
        } catch (e) {
          return exit(e);
        }
      }

      // done
      if (ret.done) return exit(null, ret.value);

      // normalize
      ret.value = toThunk(ret.value, ctx);

      // run
      if ('function' == typeof ret.value) {
        var called = false;
        try {
          ret.value.call(ctx, function(){
            if (called) return;
            called = true;
            next.apply(ctx, arguments);
          });
        } catch (e) {
          setImmediate(function(){
            if (called) return;
            called = true;
            next(e);
          });
        }
        return;
      }

      // invalid
      next(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following was passed: "' + String(ret.value) + '"'));
    }
  }
}

/**
 * Convert `obj` into a normalized thunk.
 *
 * @param {Mixed} obj
 * @param {Mixed} ctx
 * @return {Function}
 * @api private
 */

function toThunk(obj, ctx) {

  if (isGeneratorFunction(obj)) {
    return co(obj.call(ctx));
  }

  if (isGenerator(obj)) {
    return co(obj);
  }

  if (isPromise(obj)) {
    return promiseToThunk(obj);
  }

  if ('function' == typeof obj) {
    return obj;
  }

  if (isObject(obj) || Array.isArray(obj)) {
    return objectToThunk.call(ctx, obj);
  }

  return obj;
}

/**
 * Convert an object of yieldables to a thunk.
 *
 * @param {Object} obj
 * @return {Function}
 * @api private
 */

function objectToThunk(obj){
  var ctx = this;
  var isArray = Array.isArray(obj);

  return function(done){
    var keys = Object.keys(obj);
    var pending = keys.length;
    var results = isArray
      ? new Array(pending) // predefine the array length
      : new obj.constructor();
    var finished;

    if (!pending) {
      setImmediate(function(){
        done(null, results)
      });
      return;
    }

    // prepopulate object keys to preserve key ordering
    if (!isArray) {
      for (var i = 0; i < pending; i++) {
        results[keys[i]] = undefined;
      }
    }

    for (var i = 0; i < keys.length; i++) {
      run(obj[keys[i]], keys[i]);
    }

    function run(fn, key) {
      if (finished) return;
      try {
        fn = toThunk(fn, ctx);

        if ('function' != typeof fn) {
          results[key] = fn;
          return --pending || done(null, results);
        }

        fn.call(ctx, function(err, res){
          if (finished) return;

          if (err) {
            finished = true;
            return done(err);
          }

          results[key] = res;
          --pending || done(null, results);
        });
      } catch (err) {
        finished = true;
        done(err);
      }
    }
  }
}

/**
 * Convert `promise` to a thunk.
 *
 * @param {Object} promise
 * @return {Function}
 * @api private
 */

function promiseToThunk(promise) {
  return function(fn){
    promise.then(function(res) {
      fn(null, res);
    }, fn);
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return obj && 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGeneratorFunction(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return val && Object == val.constructor;
}

/**
 * Throw `err` in a new stack.
 *
 * This is used when co() is invoked
 * without supplying a callback, which
 * should only be for demonstrational
 * purposes.
 *
 * @param {Error} err
 * @api private
 */

function error(err) {
  if (!err) return;
  setImmediate(function(){
    throw err;
  });
}

},{}],8:[function(require,module,exports){
/**
 * Remove the "Error:" on the front of message
 */

var rerror = /^Error:/

/**
 * Export `Error`
 */

module.exports = error

/**
 * Initialize an error
 */

function error (errors) {
  if (!(this instanceof error)) return new error(errors)
  errors = Array.isArray(errors) ? errors : [ errors ]
  for (var i = 0; i < errors.length; i++) this[i] = errors[i]
  this.length = errors.length
  this.errors = errors
}

/**
 * Extend `Error`
 */

error.prototype = Object.create(Error.prototype)

/**
 * Lazily define stack
 */

error.prototype.__defineGetter__('stack', function() {
  return this.errors.map(function (err) {
    return err.stack
  }).join('\n\n')
})

/**
 * Lazily define message
 */

error.prototype.__defineGetter__('message', function() {
  return this.errors.map(message).join('; ')
})

/**
 * toString
 */

error.prototype.toString = function () {
  return this.errors.map(message).join('; ')
}

/*
 * Make error array-like
 */

error.prototype.splice = Array.prototype.splice
error.prototype.length = 0

/**
 * Message
 *
 * @param {String} message
 * @return {String}
 */

function message (err) {
  if (!err.message) return err.message
  return err.message.replace(rerror, '')
}

},{}],9:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":10}],10:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":11}],11:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],12:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}]},{},[1]);

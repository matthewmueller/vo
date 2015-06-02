
![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists. At less than 200 lines of code, Vo is similar in spirit to [co()](https://github.com/visionmedia/co), but is useful outside the context of generators.

## Features

- Supports synchronous & asynchronous functions, generators and promises.
- Composable & catches errors
- Tiny (4kb minified + gzip)
- Browser & server support
- Backwards compatible with co
- Well-tested (see below)

## When to use Vo

- You want the benefits of promises (composability & error handling) but just wanted to use regular functions or existing APIs.
- You want to use the control flow goodies of co but you cannot or do not want to use generators or wrapped APIs.
- You just want a simple and concise API for control flow.

## Installation

- Node.js or Browserify: `npm install vo`
- Duo & Component compatible
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

##### Here's how you'd run an asynchronous task with `vo()`:

```js
var request = require('superagent');
var vo = require('vo');

vo(function(url, done) {
  request
    .get(url)
    .end(done)
})('http://lapwinglabs.com', function(err, res) {
  // ...
})
```

##### Here's how you'd use generators, like `co()`:

```js
var request = require('superagent');
var vo = require('vo');

vo(function *(url) {
  return yield request.get(url);
})('http://lapwinglabs.com', function(err, res) {
  // ...
})
```

##### And here's how you'd use promises:

```js
var request = require('superagent-promise');
var vo = require('vo');

vo(function(url) {
  return request('get', url).end();
})('http://lapwinglabs.com', function(err, res) {
  // ...
})
```

##### Now let's get a little fancier. This is how you'd run a pipeline of tasks in series:

```js
var db = require('co-leveldb')('./cache');
var request = require('superagent');
var vo = require('vo');

function get(url, fn) {
  request
    .get(url)
    .end(function(err, res) {
      if (err) return fn(err);
      return fn(null, url, res.body);
    })
}

function *cache(url, body) {
  return yield db.put(url, body);
}

vo(get, cache)('http://lapwinglabs.com', function(err) {
  // ...
})
```

> Arguments from the previous function get passed to
> the next function.

##### And this is how you'd run a set of tasks in parallel:

```js
var request = require('superagent-promise');
var vo = require('vo');

function get(url) {
  return request('get', url).end();
}

vo([
  get('http://lapwinglabs.com'),
  get('http://leveredreturns.com')
])(function(err, responses) {
  // `responses` is an array containing the response from each
})
```

> **Important:** This also works recursively.

##### You can also run tasks in parallel using objects:

```js
var request = require('superagent-promise');
var vo = require('vo');

function get(url) {
  return request('get', url).end();
}

vo({
  lapwing: get('http://lapwinglabs.com'),
  leveredreturns: get('http://leveredreturns.com')
})(function(err, responses) {
  // `responses` is an object containing the response from each
})
```

> **Important:** This also works recursively.

##### Now for the full monty, let's compose `vo()`'s together for a complex pipeline:

```js
var request = require('superagent');
var cheerio = require('cheerio');
var vo = require('vo');

function get(url, fn) {
  request.get(url)
    .end(function(err, res) {
      if (err) return fn(err);
      return fn(null, url, res.text);
    })
}

function title(url, text) {
  var $ = cheerio.load(text);
  return $('title').text();
}

var req = vo(get, title);

vo({
  lapwing: req('http://lapwinglabs.com'),
  leveredreturns: req('http://leveredreturns.com')
})(function(err, res) {
  // `res` is an object containing each title
})
```

##### Simple, right? Well, it should be.

## Additional API

### vo.catch(onerror)

Catch all errors in the pipeline and have an opportunity to resolve them and continue. As with everything else in vo, `onerror` can be a synchronous function, asynchronous function, generators or promises.

If the error is unresolvable, simply rethrow:

```js
function a() {
  throw new Error('oh noz')
}

function onerror(err) {
  if (err.message == 'oh noz') {
    throw new Error('unresolvable')
  } else {
    return 'resolved'
  }
}

var vo = Vo(a).catch(onerror)
vo(function(err) {
  err.message //= unresolvable
})
```

You can also make use of `err.upstream` to read the arguments passed into the function that threw an error.

## Test

We have a comprehensive test suite. Here's how you run it:

```
make test
```

And here's what we test for:

```
  sync functions: vo(fn)
    ✓ should work with synchronous functions
    ✓ should catch thrown errors

  async functions: vo(fn)
    ✓ should work with asynchronous functions
    ✓ should handle errors

  generators: vo(*fn)
    ✓ should work with generators (58ms)
    ✓ should catch thrown errors

  promises: vo(promise)
    ✓ should work with promises (55ms)
    ✓ should handle errors

  thunks: vo(fn)(args, ...)(fn)
    ✓ should support thunks

  series: vo(fn, ...)
    ✓ should run in series (108ms)
    ✓ should handle errors

  arrays: vo([...])
    ✓ should run an array of functions in parallel (155ms)
    ✓ should handle errors

  objects: vo({...})
    ✓ should run an object of functions in parallel (154ms)
    ✓ should catch any errors

  composition: vo(vo(...), [vo(...), vo(...)])
    ✓ should support series composition (105ms)
    ✓ should support async composition (205ms)
    ✓ should support async composition with objects (204ms)
    ✓ should propagate errors

  vo.catch(fn)
    ✓ should catch errors and continue
    ✓ should catch errors and be done
    ✓ should support catching in arrays
    ✓ should support catching in arrays and finishing
    ✓ should support catching in objects
    ✓ should support catching in objects and finishing
    ✓ should support catching with composition
    ✓ should support cascading error handling
```

## License

MIT

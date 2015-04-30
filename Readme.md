
![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists. At less than 250 lines of code, Vo is similar in spirit to [co()](https://github.com/visionmedia/co), but is useful outside the context of generators.

## When I would use Vo

- You want the benefits of promises (composeability & error handling) but just wanted to use functions or existing APIs.
- You want to use the control flow goodies of co but you cannot or do not want to use generators or wrapped APIs.
- You just want a simple and concise API for control flow.

## Features

- Supports synchronous & asynchronous functions, generators and promises.
- Composeable & catches errors
- Tiny (4kb minified + gzip)
- Browser & server support
- Backwards compatible with co
- Well-tested (see below)

## Installation

- Node.js or Browserify: `npm install vo`
- Duo & Component compatible
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

#### Here's how you'd run an asynchronous task with `vo()`:

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

#### Here's how you'd use generators, like `co()`:

```js
var request = require('superagent');
var vo = require('vo');

vo(function *(url) {
  return yield request.get(url);
})('http://lapwinglabs.com', function(err, res) {
  // ...
})
```

#### And here's how you'd use promises:

```js
var request = require('superagent-promise');
var vo = require('vo');

vo(function(url) {
  return request('get', url).end();
})('http://lapwinglabs.com', function(err, res) {
  // ...
})
```

#### Now let's get a little fancier. This is how you'd run a pipeline of tasks in series:

```js
var db = require('level-11')('./cache');
var request = require('superagent');
var vo = require('vo');

function get(url, fn) {
  request
    .get(url)
    .end(function(err, res) {
      if (err) return fn(err);
      return fn(url, res.body);
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

#### And this is how you'd run a set of tasks in parallel:

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

#### You can also run tasks in parallel use objects:

```js
var request = require('superagent-promise');
var vo = require('vo');

function get(url) {
  return request('get', url).end();
}

vo({
  lapwing: get('http://lapwinglabs.com'),
  leveredreturns: 'http://leveredreturns.com'
})(function(err, responses) {
  // `responses` is an object containing the response from each
})
```

> **Important:** This also works recursively.

#### Now for the full monty, let's compose `vo()`'s together for a complex pipeline:

```js
function get(url) {
  return function(fn) {
    request
      .get(url)
      .end(function(err, res) {
        if (err) return fn(err);
        return fn(url, res.body);
      })
  }
}

function *cache(url, body) {
  return yield db.put(url, body);
}

var lapwing = vo(get('http://lapwinglabs.com'), cache);
var leveredreturns = vo(get('http://leveredreturns.com'), cache);

vo([lapwing, leveredreturns])(function(err) {
  // get and cache these sites in parallel
})
```

#### Simple, right? Well, it should be.

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
  ✓ should work with generators
  ✓ should catch thrown errors

promises: vo(promise)
  ✓ should work with promises
  ✓ should handle errors

series: vo(fn, ...)
  ✓ should run in series
  ✓ should handle errors

arrays: vo([...])
  ✓ should run an array of functions in parallel
  ✓ should handle errors

objects: vo({...})
  ✓ should run an object of functions in parallel
  ✓ should catch any errors

composition: vo(vo(...), [vo(...), vo(...)])
  ✓ should support series composition
  ✓ should support async composition
  ✓ should support async composition with objects
  ✓ should propogate errors
```

## License

MIT

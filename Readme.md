
![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists.

## Features

- Seamlessly supports promises, generators, synchronous & asynchronous functions.
- Vo instances are composable with each other, allowing you to coordinate complex tasks simply
- Supports both middleware and pipeline task flow
- Easily catch and fix errors anywhere in the pipeline
- Returns a promise that you can yield on or "await"
- Tiny (4kb minified + gzip)
- Browser & server support
- Well-tested

## Installation

- Node.js or Browserify: `npm install vo`
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Migration from 1.x to 2.x

2.x is a complete re-write of vo and is not backwards compatible with 1.x. In the first version return values were passed on to the next function by default. In this version the default uses fixed arguments you pass in when you call vo. This is how middleware works in libraries like express and koa. You can pipeline your results by calling `vo.pipeline(...)` to achieve the same results as 1.x.

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
var request = require('superagent');
var vo = require('vo');

vo(function(url) {
  return request('get', url);
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

vo.pipeline(get, cache)('http://lapwinglabs.com', function(err) {
  // ...
})
```

> If you have an array, you can use `vo.pipeline.call(series)` to run that array in series.

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
npm install
make test
```

## License

MIT


![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists.

## What you get

- **new in 4.0** Consistent function signatures
- Tiny library (4kb minified + gzipped)
- Supports promises, generators, & sync functions
- Serial and parallel execution for every flow
- 2 different kinds of flows: pipeline & stack
- Easily catch and fix errors anywhere in the pipeline
- Errors passed as arguments so you know where the failure occurred
- Returns a promise that you can yield on or "await"
- Browser & server support
- Well-tested

## Installation

- Node.js or Browserify: `npm install vo`
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

Vo supports 2 kinds of asynchronous flows:

- **pipelines**: Transformation pipeline. Return values become the arguments to the next function
- **stacks**: Express-style. Arguments are passed in at the top and flow through each middleware function

Both of these flows support both parallel and serial execution

## Example

```js
function * get (url) {
  return yield fetch(url)
}

function map (responses) {
  return responses.map(res => res.status)
}

vo([
  fetch('https://standupjack.com'),
  fetch('https://google.com')
], map).then(function (statuses) {
  assert.deepEqual([ 200, 200 ])
})
```

## Guide

Coming soon! Check out the comprehensive [test suite](test/) for now.

## Vo Runtime

Now you can run generators top-level with the runtime:

**index.js**

```js
var res = yield superagent.get('http://google.com')
console.log(res.status) // 200
```

```bash
vo index.js
```

### FAQ

##### Binding a generator function isn't implemented consistently yet

Use [co-bind](https://github.com/vdemedes/co-bind) just to be safe.

## Test

We have a comprehensive test suite. Here's how you run it:

```
npm install
make test
```

## License

MIT

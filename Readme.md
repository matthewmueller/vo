
![img](https://cldup.com/GbKb42jNdt.png)

Minimalist, yet complete control flow library

## What you get

- **new in 4.0** Consistent function signatures
- Tiny library (16kb minified + gzipped, common modules)
- 2 different kinds of flows: pipeline & stack
- Browser & server support
- Supports promises, generators, & sync functions
- Serial and parallel execution for every flow
- Returns a promise that you can yield on or "await"
- `DEBUG=vo` for insight into what is being called
- Easily catch and fix errors anywhere in the pipeline
- Errors passed as arguments so you know where the failure occurred
- Early exit support
- Well-tested

## Installation

- Node.js or Browserify: `npm install vo`
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

Vo supports 2 kinds of asynchronous flows:

- **pipelines**: Transformation pipeline. Return values become the arguments to the next function. As of **4.0.0**, only the first argument to vo changes.
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

## Learn by example

There's a lot going on behind the scenes of vo, so lets take these examples one at a time:

### Pipelines

Behaves like transform streams, where return values become arguments to the next function.

1. [single argument, executed in order](examples/1-pipeline-single-order.js)
2. [multiple arguments, executed in order](examples/2-pipeline-single-parallel.js)
3. [single argument, executed in parallel](examples/3-pipeline-multi-order.js)
4. [multiple arguments, executed in parallel](examples/4-pipeline-multi-parallel.js)
5. [exit early from the pipeline](examples/5-pipeline-early-exit.js)
6. [error in the pipeline](examples/6-pipeline-error.js)
7. [catch error and continue](examples/7-pipeline-catch-error.js)
8. [pipeline composition using promises](examples/8-pipeline-composition.js)
9. [pipeline composition with generators](examples/9-pipeline-composition.js)

### Stacks

Behaves like express middleware, where the initial arguments are arguments to every function, regardless of return value.

Examples coming soon! Check out the comprehensive [test suite](test/) for now.

### Compose

Not implemented yet! Going to use Blake's excellent [throwback](https://github.com/blakeembrey/throwback) library to implement this. Also, accepting PRs :-D

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

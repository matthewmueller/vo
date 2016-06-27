
![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists.

## What you get

- Tiny library (4kb minified + gzipped)
- Supports promises & generators
- Serial and parallel execution
- 3 different kinds of flows
- Easily catch and fix errors anywhere in the pipeline
- Returns a promise that you can yield on or "await"
- Browser & server support
- Well-tested

## Installation

- Node.js or Browserify: `npm install vo`
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

Vo supports 3 kinds of asynchronous flows:

- **pipelines**: Transformation pipeline. Return values become the arguments to the next function
- **stacks**: Express-style. Arguments are passed in at the top and flow through each middleware function
- **composition**: Koa-style. Flows downstream through the functions, then back up.

###

An updated guide will be available soon. For now, take a look at the [tests](test/) for now.

## Test

We have a comprehensive test suite. Here's how you run it:

```
npm install
make test
```

## License

MIT


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

An updated guide will be available soon. For now, take a look at the [tests](test/) for now.

## Test

We have a comprehensive test suite. Here's how you run it:

```
npm install
make test
```

## License

MIT

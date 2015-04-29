
![img](https://cldup.com/GbKb42jNdt.png)

co() with optional generator support and the last control flow library you'll need.


Seems simple, right? Well, it should be.

## Features

- Tiny

## Installation

- Node.js or Browserify: `npm install vo`
- Duo & Component compatible
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

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

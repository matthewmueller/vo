
![img](https://cldup.com/GbKb42jNdt.png)

co() with optional generator support and the last control flow library you'll need.


Seems simple, right? Well, it should be.

## Installation

- Node.js or Browserify: `npm install vo`
- Duo & Component compatible
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Test

We have a comprehensive test suite. Here's how you run it

```
npm install
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
  ✓ should work with generators (54ms)
  ✓ should catch thrown errors

promises: vo(promise)
  ✓ should work with promises (52ms)
  ✓ should handle errors

series: vo(fn, ...)
  ✓ should run in series (106ms)
  ✓ should handle errors

arrays: vo([...])
  ✓ should run an array of functions in parallel (155ms)
  ✓ should handle errors

objects: vo({...})
  ✓ should run an object of functions in parallel (156ms)
  ✓ should catch any errors

composition: vo(vo(...), [vo(...), vo(...)])
  ✓ should support series composition (106ms)
  ✓ should support async composition (203ms)
  ✓ should support async composition with objects (205ms)
  ✓ should propogate errors
```

## License

MIT

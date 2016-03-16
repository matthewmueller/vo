
![img](https://cldup.com/GbKb42jNdt.png)

Vo is a control flow library for minimalists.

## Features

- Seamlessly supports promises, generators, synchronous & asynchronous functions.
- Vo is composable, allowing you to intuitively orchestrate complex work flows
- Easily catch and fix errors anywhere in the pipeline
- Returns a promise that you can yield on or "await"
- Supports both stack and pipeline task flow
- Tiny (4kb minified + gzip)
- Browser & server support
- Well-tested

## Installation

- Node.js or Browserify: `npm install vo`
- Standalone: [vo.js](dist/vo.js) & [vo.min](dist/vo.min.js)

## Getting Started

An updated guide will be available soon. For now, take a look at the [tests](test/) for now.

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

## Things to keep in mind

### Binding a generator function isn't consistently implemented yet

```js
function * a () {
  // this === ctx
}

vo(a.bind(ctx))
```

The following will work on node 5 and latest chrome, but not on latest safari or node 4. Latest babel does not fix this problem.

Just to be safe, I'd install [co-bind](https://github.com/vdemedes/co-bind) and do this instead:

```js
var bind = require('co-bind')

function * a () {
  // this === ctx
}

vo(bind(a, ctx))
```

## Test

We have a comprehensive test suite. Here's how you run it:

```
npm install
make test
```

## License

MIT

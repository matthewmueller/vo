/**
 * Module Dependencies
 */

var Promise = require('es6-promise').Promise;
var assert = require('assert');
var Vo = require('..');

/**
 * Tests
 */

describe('sync functions: vo(fn)', function() {
  it('should work with synchronous functions', function(done) {
    function sync(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return a + b;
    }

    Vo(sync)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal(v, 'ab');
      done();
    })
  })

  it('should catch thrown errors', function(done) {
    function sync(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      throw new Error('some error');
      return a + b;
    }

    Vo(sync)('a', 'b', function(err, v) {
      assert.equal('some error', err.message);
      assert.equal(undefined, v);
      done();
    })
  })
});

describe('async functions: vo(fn)', function() {
  it('should work with asynchronous functions', function(done) {
    function async(a, b, fn) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      fn(null, a + b);
    }

    Vo(async)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal(v, 'ab');
      done();
    });
  });

  it('should handle errors', function(done) {
    function sync(a, b, fn) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return fn(new Error('some error'));
    }

    Vo(sync)('a', 'b', function(err, v) {
      assert.equal('some error', err.message);
      assert.equal(undefined, v);
      done();
    })
  })
});

describe('generators: vo(*fn)', function() {
  it('should work with generators', function(done) {
    function *gen(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return yield timeout(50);
    }

    Vo(gen)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal(v, 50);
      done();
    });
  })

  it('should catch thrown errors', function() {
    function *gen(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      throw new Error('some error');
      return a + b;
    }

    Vo(gen)('a', 'b', function(err, v) {
      assert.equal('some error', err.message);
      assert.equal(undefined, v);
      done();
    });
  })
});

describe('promises: vo(promise)', function() {
  it('should work with promises', function(done) {
    function promise(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return promise_timeout(50);
    }

    Vo(promise)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal(v, 50);
      done();
    })
  })

  it('should handle errors', function(done) {
    function promise(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return promise_timeout(0);
    }

    Vo(promise)('a', 'b', function(err, v) {
      assert.equal('no ms present', err.message);
      assert.equal(undefined, v);
      done();
    })
  });
});

describe('series: vo(fn, ...)', function() {
  it('should run in series', function(done) {
    var o = [];

    function a(a, b) {
      o.push('a');
      assert.equal('a', a);
      assert.equal('b', b);
      return 'a';
    }

    function b(a, fn) {
      o.push('b');
      assert.equal('a', a);
      fn(null, 'b1', 'b2');
    }

    function c(a, b) {
      assert.equal('b1', a);
      assert.equal('b2', b);
      o.push('c');
      return promise_timeout(50, 'c');
    }

    function *d(c) {
      o.push('d');
      assert.equal('c', c);
      return yield timeout(50, 'd');
    }


    Vo(a, b, c, d)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.deepEqual(['a', 'b', 'c', 'd'], o);
      assert.deepEqual('d', v);
      done();
    })
  })

  it('should handle errors', function(done) {
    var o = [];

    function a(a, b) {
      o.push('a');
      assert.equal('a', a);
      assert.equal('b', b);
      return 'a';
    }

    function b(a, fn) {
      o.push('b');
      assert.equal('a', a);
      fn(null, 'b1', 'b2');
    }

    function c(a, b) {
      o.push('c');
      assert.equal(a, 'b1');
      assert.equal(b, 'b2');
      return promise_timeout(null, 'c');
    }

    function *d(a, b) {
      o.push('d');
      assert.equal('a', a);
      assert.equal('b', b);
      return yield timeout(50, 'd');
    }


    Vo(a, b, c, d)('a', 'b', function(err, v) {
      assert.equal('no ms present', err.message);
      assert.equal(undefined, v);
      assert.deepEqual(['a', 'b', 'c'], o);
      done();
    })
  })
});

describe('arrays: vo([...])', function() {
  function to(ms, arr) {
    return function(fn) {
      timeout(ms)(function(err, v) {
        if (!ms) return fn(new Error('ms must be specified'));
        arr.push(v);
        fn(err, v);
      })
    }
  }

  it('should run an array of functions in parallel', function(done) {
    var o = [];

    Vo([to(50, o), to(150, o), to(100, o)])(function(err, v) {
      if (err) return done(err);
      assert.deepEqual([50, 150, 100], v);
      assert.deepEqual([50, 100, 150], o);
      done();
    })

  })

  it('should handle errors', function(done) {
    var o = [];

    Vo([to(50, o), to(0, o), to(100, o)])(function(err, v) {
      assert.equal('ms must be specified', err.message);
      assert.equal(undefined, v);
      done();
    });
  });
});

describe('objects: vo({...})', function() {
  function to(ms, arr) {
    return function(fn) {
      timeout(ms)(function(err, v) {
        if (!ms) return fn(new Error('ms must be specified'));
        arr.push(v);
        fn(err, v);
      })
    }
  }

  it('should run an object of functions in parallel', function(done) {
    var o = [];

    Vo({ a: to(50, o), b: to(150, o), c: to(100, o) })(function(err, v) {
      if (err) return done(err);
      assert.deepEqual(v, {
        a: 50,
        b: 150,
        c: 100
      });

      assert.deepEqual([50, 100, 150], o);
      done();
    })
  })

  it('should catch any errors', function(done) {
    var o = [];

    Vo({ a: to(50, o), b: to(150, o), c: to(0, o) })(function(err, v) {
      assert.equal('ms must be specified', err.message);
      assert.equal(undefined, v);
      done();
    })
  })
});

describe('composition: vo(vo(...), [vo(...), vo(...)])', function() {

  it('should support series composition', function(done) {
    var o = [];

    function a(a, b) {
      o.push('a');
      assert.equal('a', a);
      assert.equal('b', b);
      return 'a';
    }

    function b(a, fn) {
      o.push('b');
      assert.equal('a', a);
      fn(null, 'b1', 'b2');
    }

    function c(b) {
      o.push('c');
      assert.deepEqual(['b1', 'b2'], b);
      return promise_timeout(50, 'c');
    }

    function *d(c) {
      o.push('d');
      assert.equal('c', c);
      return yield timeout(50, 'd');
    }

    Vo(Vo(a, b), c, d)('a', 'b', function(err, v) {
      if (err) return done(err);
      assert.equal('d', v);
      assert.deepEqual(['a', 'b', 'c', 'd'], o);
      done();
    })
  });

  it('should support async composition', function(done) {
    function to(ms, arr) {
      return function(fn) {
        timeout(ms)(function(err, v) {
          if (!ms) return fn(new Error('ms must be specified'));
          arr.push(v);
          fn(err, v);
        })
      }
    }

    var o = [];
    var a = Vo([to(50, o), to(150, o)]);
    var b = Vo([to(100, o), to(200, o)]);

    Vo([a, b])(function(err, v) {
      if (err) return done(err);
      assert.deepEqual([[50, 150], [100, 200]], v);
      assert.deepEqual([50, 100, 150, 200], o);
      done();
    });
  })

  it('should support async composition with objects', function(done) {
    function to(ms, arr) {
      return function(fn) {
        timeout(ms)(function(err, v) {
          if (!ms) return fn(new Error('ms must be specified'));
          arr.push(v);
          fn(err, v);
        })
      }
    }

    var o = [];
    var a = Vo({ a1: to(50, o), a2: to(150, o) });
    var b = Vo({ b1: to(100, o), b2: to(200, o) });

    Vo({ c1: a, c2: b })(function(err, v) {
      if (err) return done(err);

      assert.deepEqual(v, {
        c1: {
          a1: 50,
          a2: 150
        },
        c2: {
          b1: 100,
          b2: 200
        }
      });
      assert.deepEqual([50, 100, 150, 200], o);

      done();
    });
  });

  it('should propogate errors', function(done) {
    function to(ms, arr) {
      return function(fn) {
        timeout(ms)(function(err, v) {
          if (!ms) return fn(new Error('ms must be specified'));
          arr.push(v);
          fn(err, v);
        })
      }
    }

    var o = [];
    var a = Vo({ a1: to(50, o), a2: to(0, o) });
    var b = Vo({ b1: to(100, o), b2: to(200, o) });

    Vo({ c1: a, c2: b })(function(err, v) {
      assert.equal('ms must be specified', err.message);
      assert.equal(undefined, v);
      done();
    });
  });
})

/**
 * Timeout thunk
 *
 * @param {Number} ms
 * @return {Function}
 */

function timeout(ms, arg) {
  return function(fn) {
    setTimeout(function() {
      fn(null, arg || ms);
    }, ms);
  }
}

/**
 * Promise timeout
 *
 * @param {Number} ms
 * @param {Promise}
 */

function promise_timeout(ms, arg) {
  return new Promise(function(resolve, reject) {
    // error
    if (!ms) {
      setTimeout(function() {
        reject(new Error('no ms present'))
      }, 0)
    }

    setTimeout(function() {
      resolve(arg || ms);
    }, ms);
  });
}

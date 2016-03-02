/**
 * Module Dependencies
 */

var assert = require('assert');
var Vo = require('..');

/**
 * Tests
 */

describe('stack', function() {

  describe('vo()', function() {
    it('should work with no function', function(done) {
      Vo.stack()('a', function(err, a) {
        assert.ok(!err);
        assert.deepEqual(a, 'a');
        done();
      })
    })

    it('should work with no function and passing in multiple values', function(done) {
      Vo.stack()('a', 'b', function(err, a, b) {
        assert.ok(!err);
        assert.deepEqual(a, 'a')
        assert.deepEqual(b, 'b')
        done();
      })
    })

    it('should return an array if were using promises', function(done) {
      Vo.stack()('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
          done()
        })
        .catch(done)
    })

    it('should return an array if were using generators', function *() {
      var v = yield Vo.stack()('a', 'b')
      assert.deepEqual(v, ['a', 'b'])
    })
  })

  describe('literals', function() {
    it('should strings through', function(done) {
      Vo.stack('hi')('hello', function(err, v) {
        if (err) return done(err)
        assert.equal(v, 'hello')
        done()
      })
    })

    it('should booleans through', function(done) {
      Vo.stack(false)(true, function(err, v) {
        if (err) return done(err)
        assert.ok(v === true)
        done()
      })
    })

    it('should pass numbers through', function(done) {
      Vo.stack(3)(6, function(err, v) {
        if (err) return done(err)
        assert.equal(v, 6)
        done()
      })
    })
  })

  describe('sync functions', function() {
    function sync(a, b) {
      assert.equal(a, 'a');
      assert.equal(b, 'b');
      return a + b;
    }

    it('should work with sync functions', function (done) {
      Vo.stack(sync)('a', 'b', function (err, a, b) {
        if (err) return done(err);
        assert.deepEqual(a, 'a');
        assert.deepEqual(b, 'b');
        done();
      })
    })

    it('should return an array if were using promises', function() {
      return Vo.stack(sync)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })

    it('should return a single value if were using promises and a single arg', function() {
      function sync (ab) {
        assert.deepEqual(ab, ['a', 'b'])
      }

      return Vo.stack(sync)(['a', 'b'])
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })

    it('should return an array if were using generators and have multiple args', function *() {
      var v = yield Vo.stack(sync)('a', 'b')
      assert.deepEqual(v, ['a', 'b'])
    })

    it('should return an single value if were using generators have one arg', function *() {
      function sync (ab) {
        assert.deepEqual(ab, ['a', 'b'])
      }

      var v = yield Vo.stack(sync)(['a', 'b'])
      assert.deepEqual(v, ['a', 'b'])
    })
  })

  describe('promises: vo(fn)(args, ...).then()', function() {
    it('should support promises', function(done) {
      function async(a, b, fn) {
        assert.equal(a, 'a');
        assert.equal(b, 'b');
        return fn(null, a + b);
      }

      Vo.stack(async)('a', 'b')
        .then(function (v) {
          done()
        })
        .catch (function (e) {
          console.log(e)
        })
    })
  })

  describe('stack: vo(fn, ...)', function() {
    it('should run in stack', function(done) {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(50, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }


      Vo.stack(a, b, c, d)('a', 'b', function(err, a, b) {
        if (err) return done(err);
        assert.deepEqual(['a', 'b', 'c', 'd'], o);
        assert.equal('a', a);
        assert.equal('b', b);
        done();
      })
    })

    it('should run in stack (using the context)', function(done) {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(50, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }


      Vo.stack.apply([a, b, c, d])('a', 'b', function(err, a, b) {
        if (err) return done(err);
        assert.deepEqual(['a', 'b', 'c', 'd'], o);
        assert.equal('a', a);
        assert.equal('b', b);
        done();
      })
    })

    it('should run in stack (including a context)', function(done) {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(50, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }


      Vo.stack.apply([a, b, c, d]).call({ ctx: 'ctx'}, 'a', 'b', function(err, a, b) {
        if (err) return done(err);
        assert.deepEqual(['a', 'b', 'c', 'd'], o);
        assert.equal('a', a);
        assert.equal('b', b);
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

      function b(a, b, fn) {
        o.push('b');
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(null, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }


      Vo.stack(a, b, c, d)('a', 'b', function(err, v) {
        includes(err.message, 'no ms present')
        assert.equal(undefined, v);
        assert.deepEqual(['a', 'b', 'c'], o);
        done();
      })
    })

    it('should handle errors (using the context)', function(done) {
      var o = []

      function a(a, b) {
        o.push('a');
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(null, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }

      Vo.stack.call([a, b, c, d])('a', 'b', function(err, v) {
        includes(err.message, 'no ms present')
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

      Vo.stack([to(50, o), to(150, o), to(100, o)])(function(err) {
        if (err) return done(err);
        assert.deepEqual([50, 100, 150], o);
        done();
      })
    })

    it('should handle errors', function(done) {
      var o = [];

      Vo.stack([to(50, o), to(0, o), to(100, o)])(function(err, v) {
        includes(err.message, 'ms must be specified')
        assert.equal(undefined, v);
        done();
      });
    });

    it('should handle a single array', function(done) {
      var vo = Vo.stack(function(a) {
        assert.deepEqual(a, [1, 2, 3])
        return a;
      })

      vo([1, 2, 3], function(err, v) {
        assert.ok(!err);
        assert.deepEqual(v, [1, 2, 3])
        done();
      })
    })
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

      Vo.stack({ a: to(50, o), b: to(150, o), c: to(100, o) })(function(err, v) {
        if (err) return done(err);
        assert.deepEqual(v, undefined);
        assert.deepEqual([50, 100, 150], o);
        done();
      })
    })

    it('should pass through any literals', function() {
      return Vo.stack({
        type: 'create user',
        payload: {
          name: 'matt',
          age: 26,
          favorite_numbers: [36, 88],
          superuser: undefined,
          admin: null
        }
      })('anything').then(function (v) {
        assert.equal(v, 'anything')
      })
    })

    it('should catch any errors', function(done) {
      var o = [];

      Vo.stack({ a: to(50, o), b: to(150, o), c: to(0, o) })(function(err, v) {
        includes(err.message, 'ms must be specified')
        assert.equal(undefined, v);
        done();
      })
    })
  });

  describe('composition: vo(vo(...), [vo(...), vo(...)])', function() {

    it('should support stack composition', function(done) {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(50, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }

      Vo.stack(Vo.stack(a, b), c, d).call({ ctx: 'ctx' }, 'a', 'b', function(err, a, b) {
        if (err) return done(err);
        assert.equal(this.ctx, 'ctx')
        assert.equal('a', a);
        assert.equal('b', b);
        assert.deepEqual(['a', 'b', 'c', 'd'], o);
        done();
      })
    });

    it('should support stack composition, returning an array if it\'s a promise', function() {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function b(a, b, fn) {
        o.push('b');
        assert.equal('a', a);
        assert.equal('b', b);
        fn(null, 'b1', 'b2');
      }

      function c(a, b) {
        o.push('c');
        assert.equal('a', a);
        assert.equal('b', b);
        return promise_timeout(50, 'c');
      }

      function *d(a, b) {
        o.push('d');
        assert.equal('a', a);
        assert.equal('b', b);
        return yield timeout(50, 'd');
      }

      return Vo.stack(Vo.stack(a, b), c, d)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    });

    it('should support async composition', function(done) {
      function to(ms, arr) {
        return function(fn) {
          assert.equal(this.ctx, 'ctx')
          timeout(ms)(function(err, v) {
            if (!ms) return fn(new Error('ms must be specified'));
            arr.push(v);
            fn(err, v);
          })
        }
      }

      var o = [];
      var a = Vo.stack([to(50, o), to(150, o)]);
      var b = Vo.stack([to(100, o), to(200, o)]);

      Vo.stack([a, b]).call({ ctx: 'ctx' }, function(err, v) {
        if (err) return done(err);
        assert.deepEqual(v, undefined);
        assert.deepEqual([50, 100, 150, 200], o);
        done();
      });
    })

    it('should support async composition with objects', function(done) {
      function to(ms, arr) {
        return function(fn) {
          assert.equal(this.ctx, 'ctx')
          timeout(ms)(function(err, v) {
            if (!ms) return fn(new Error('ms must be specified'));
            arr.push(v);
            fn(err, v);
          })
        }
      }

      var o = [];
      var a = Vo.stack({ a1: to(50, o), a2: to(150, o) });
      var b = Vo.stack({ b1: to(100, o), b2: to(200, o) });

      Vo.stack({ c1: a, c2: b }).call({ ctx: 'ctx'}, function(err, v) {
        if (err) return done(err);

        assert.deepEqual(v, undefined);
        assert.deepEqual([50, 100, 150, 200], o);

        done();
      });
    });

    it('should propagate errors', function(done) {
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
      var a = Vo.stack({ a1: to(50, o), a2: to(0, o) });
      var b = Vo.stack({ b1: to(100, o), b2: to(200, o) });

      Vo.stack({ c1: a, c2: b })(function(err, v) {
        includes(err.message, 'ms must be specified')
        assert.equal(undefined, v);
        done();
      });
    });
  })
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

/**
 * Includes error
 */

function includes (actual, expected) {
  if (!~actual.indexOf(expected)) {
    throw new Error(`"${actual}" does not contain "${expected}"`)
  }
}

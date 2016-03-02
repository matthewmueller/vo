/**
 * Module Dependencies
 */

var assert = require('assert');
var Vo = require('..');

/**
 * Tests
 */

describe('pipeline', function() {
  describe('literals', function() {
    it('should strings through', function(done) {
      Vo('hi')(function(err, v) {
        if (err) return done(err)
        assert.equal(v, 'hi')
        done()
      })
    })

    it('should booleans through', function(done) {
      Vo(false)(function(err, v) {
        if (err) return done(err)
        assert.ok(v === false)
        done()
      })
    })

    it('should pass numbers through', function(done) {
      Vo(3)(function(err, v) {
        if (err) return done(err)
        assert.equal(v, 3)
        done()
      })
    })
  })

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
        includes(err.message, 'some error');
        assert.equal(v, undefined);
        done();
      })
    })

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
        function async(a, b, fn) {
          assert.equal(a, 'a');
          assert.equal(b, 'b');
          return fn(new Error('some error'));
        }

        Vo(async)('a', 'b', function(err, v) {
          includes(err.message, 'some error');
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
          includes(err.message, 'some error');
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
          includes(err.message, 'no ms present');
          assert.equal(undefined, v);
          done();
        })
      });
    });
  });

  describe('promises: vo(fn)(args, ...).then()', function() {
    it('should support promises', function() {
      function async(a, b, fn) {
        assert.equal(a, 'a');
        assert.equal(b, 'b');
        return fn(null, a + b);
      }

      return Vo(async)('a', 'b')
        .then(function (v) {
          assert.equal(v, 'ab')
        })
    })
  })

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

    it('should run in series (using the context)', function(done) {
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


      Vo.apply([a, b, c, d])('a', 'b', function(err, v) {
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
        includes(err.message, 'no ms present')
        assert.equal(undefined, v);
        assert.deepEqual(['a', 'b', 'c'], o);
        done();
      })
    })

    it('should handle errors (using the context)', function(done) {
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


      Vo.call([a, b, c, d])('a', 'b', function(err, v) {
        includes(err.message, 'no ms present');
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
        includes(err.message, 'ms must be specified');
        assert.equal(undefined, v);
        done();
      });
    });

    it('should handle a single array', function(done) {
      var vo = Vo(function(a) {
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

    it('should pass through any literals', function() {
      return Vo({
        type: 'create user',
        payload: {
          name: 'matt',
          age: 26,
          favorite_numbers: [36, 88],
          superuser: undefined,
          admin: null
        }
      })('anything').then(function (v) {
        assert.deepEqual(v, {
          type: 'create user',
          payload: {
            name: 'matt',
            age: 26,
            favorite_numbers: [36, 88],
            superuser: undefined,
            admin: null
          }
        })
      })
    })

    it('should catch any errors', function(done) {
      var o = [];

      Vo({ a: to(50, o), b: to(150, o), c: to(0, o) })(function(err, v) {
        includes(err.message, 'ms must be specified');
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

      function c(b1, b2) {
        o.push('c');
        assert.equal(b1, 'b1')
        assert.equal(b2, 'b2')
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
      var a = Vo({ a1: to(50, o), a2: to(0, o) });
      var b = Vo({ b1: to(100, o), b2: to(200, o) });

      Vo({ c1: a, c2: b })(function(err, v) {
        includes(err.message, 'ms must be specified');
        assert.equal(undefined, v);
        done();
      });
    });
  })

  describe('working with vo()', function() {
    it('should also work with vo', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'd'
      }

      function b (d) {
        assert.equal(d, 'd')
        return 'b'
      }

      function c (b) {
        assert.equal(b, 'b')
        return 'c'
      }

      return Vo(a, Vo(b, c))('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, 'c')
        })
    })

    it('should also work with vo first arg', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'd'
      }

      function b (d) {
        assert.equal(d, 'd')
        return 'b'
      }

      function c (b) {
        assert.equal(b, 'b')
        return 'c'
      }

      return Vo(Vo(a, b), c)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, 'c')
        })
    })
  })
});


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

/**
 * Module Dependencies
 */

var assert = require('assert');
var bind = require('co-bind');
var Vo = require('..');

/**
 * Tests
 */

describe('pipeline', function() {
  describe('literals', function() {
    it('should pass strings through', function(done) {
      Vo('hi')(function(err, v) {
        if (err) return done(err)
        assert.equal(v, 'hi')
        done()
      })
    })

    it('should pass booleans through', function(done) {
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

  describe('generators: vo(*fn)', function() {
    it('should return a single value', function(done) {
      function *gen(a) {
        assert.equal(a, 'a');
        return yield timeout(50);
      }

      Vo(gen)('a', function(err, v) {
        if (err) return done(err);
        assert.deepEqual(v, 50)
        done();
      });
    })

    it('should return an array when multiple args', function(done) {
      function *gen(a, b) {
        assert.equal(a, 'a');
        assert.equal(b, 'b');
        return yield timeout(50);
      }

      Vo(gen)('a', 'b', function(err, a, b) {
        if (err) return done(err);
        assert.equal(a, 50)
        assert.equal(b, 'b')
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
    it('should work with a single arg', function(done) {
      function promise(a, b) {
        assert.equal(a, 'a');
        return promise_timeout(50);
      }

      Vo(promise)('a', function(err, v) {
        if (err) return done(err);
        assert.equal(v, 50);
        done();
      })
    })

    it('should return first with array of args', function(done) {
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

    it('should work with 3 args', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'a'
      }

      function b (d, a) {
        assert.equal(d, 'd')
        assert.equal(a, 'a')
        return 'b'
      }

      function c (d, a) {
        assert.equal(d, 'd')
        assert.equal(a, 'a')
        return 'c'
      }

      return Vo([b, c])('d', 'a', 'b').then(function (v) {
        assert.deepEqual(v, [['b', 'c'], 'a', 'b'])
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
  // });

  describe('promises: vo(fn)(args, ...).then()', function() {
    it('single arg', function() {
      function * gen (a) {
        assert.equal(a, 'a');
        return a
      }

      return Vo(gen)('a')
        .then(function (v) {
          assert.deepEqual(v, 'a')
        })
    })

    it('multiple args', function() {
      function * gen (a, b, fn) {
        assert.equal(a, 'a');
        assert.equal(b, 'b');
        return a + b
      }

      return Vo(gen)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['ab', 'b'])
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
        return 'a1';
      }

      function b(a, b) {
        o.push('b');
        assert.equal('a1', a)
        assert.equal('b', b)
        return 'b'
      }

      function c(b1, b2) {
        assert.equal('b', b1);
        assert.equal('b', b2);
        o.push('c');
        return promise_timeout(50, 'c');
      }

      function * d(c) {
        o.push('d');
        assert.equal('c', c);
        return yield timeout(50, 'd');
      }


      Vo(a, b, c, d)('a', 'b', function(err, v) {
        if (err) return done(err);
        assert.deepEqual(o, ['a', 'b', 'c', 'd']);
        assert.deepEqual(v, 'd');
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
        assert.equal('a', a)
        return 'b'
      }

      function c(b) {
        assert.equal('b', b);
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
        assert.deepEqual(v, 'd');
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

      function b(a, b) {
        o.push('b');
        assert.equal(a, 'a');
        assert.equal(b, 'b');
        return 'b'
      }

      function c(b1, b2) {
        o.push('c');
        assert.equal(b1, 'b');
        assert.equal(b2, 'b');
        return promise_timeout(null, 'c');
      }

      function * d(a, b) {
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

      function b(a) {
        o.push('b');
        assert.equal('a', a);
        return 'b'
      }

      function c(b1, b2) {
        o.push('c');
        assert.equal(b1, 'b');
        assert.equal(b2, 'b');
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
      return function() {
        return promise_timeout(ms)
          .then(function (v) {
            arr.push(v);
            return v
          })
      }
    }

    it('should run an array of functions in parallel', function(done) {
      var o = [];

      Vo([to(50, o), to(150, o), to(100, o)])(function(err, v) {
        if (err) return done(err);
        assert.deepEqual(o, [50, 100, 150]);
        assert.deepEqual(v, [50, 150, 100]);
        done();
      })

    })

    it('should handle errors', function(done) {
      var o = [];

      Vo([to(50, o), to(0, o), to(100, o)])(function(err, v) {
        includes(err.message, 'no ms present');
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
      return function() {
        return promise_timeout(ms)
          .then(function (v) {
            arr.push(v);
            return v
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
          admin: null,
          object: {},
          array: []
        }
      })('anything').then(function (v) {
        assert.deepEqual(v, {
          type: 'create user',
          payload: {
            name: 'matt',
            age: 26,
            favorite_numbers: [36, 88],
            superuser: undefined,
            admin: null,
            object: {},
            array: []
          }
        })
      })
    })

    it('should catch any errors', function(done) {
      var o = [];

      Vo({ a: to(50, o), b: to(150, o), c: to(0, o) })(function(err, v) {
        includes(err.message, 'no ms present');
        assert.equal(undefined, v);
        done();
      })
    })
  });

  describe('composition: vo(vo(...), [vo(...), vo(...)])', function() {

    it('should support series composition', function() {
      var o = [];

      function a(a, b) {
        o.push('a');
        assert.equal('a', a);
        assert.equal('b', b);
        return 'a';
      }

      function * b(a) {
        o.push('b');
        assert.equal('a', a);
        return 'b'
      }

      function c(b1, b2) {
        o.push('c');
        assert.equal(b1, 'b')
        assert.equal(b2, 'b')
        return promise_timeout(50, 'c');
      }

      function *d(c) {
        o.push('d');
        assert.equal('c', c);
        return yield timeout(50, 'd');
      }

      return Vo(Vo(a, b), c, d)('a', 'b').then(v => {
        assert.deepEqual(v, ['d', 'b']);
        assert.deepEqual(o, ['a', 'b', 'c', 'd']);
      })
    });

    it('should support async composition', function() {
      function to(ms, arr) {
        return function() {
          return promise_timeout(ms)
            .then(function (v) {
              arr.push(v);
              return v
            })
        }
      }

      var o = [];
      var a = Vo([to(50, o), to(150, o)]);
      var b = Vo([to(100, o), to(200, o)]);
      return Vo([a, b]).then(function (v) {
        assert.deepEqual([[50, 150], [100, 200]], v);
        assert.deepEqual([50, 100, 150, 200], o);
      });
    })

    it('should support async composition with objects', function () {
      function to(ms, arr) {
        return function() {
          return promise_timeout(ms)
            .then(function (v) {
              arr.push(v);
              return v
            })
        }
      }

      var o = [];
      var a = Vo({ a1: to(50, o), a2: to(150, o) });
      var b = Vo({ b1: to(100, o), b2: to(200, o) });

      return Vo({ c1: a, c2: b }).then(function (v) {
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
        assert.deepEqual(o, [50, 100, 150, 200]);
      });
    });

    it('should propagate errors', function(done) {
      function to(ms, arr) {
        return function() {
          return promise_timeout(ms)
            .then(function (v) {
              arr.push(v);
              return v
            })
        }
      }

      var o = [];
      var a = Vo({ a1: to(50, o), a2: to(0, o) });
      var b = Vo({ b1: to(100, o), b2: to(200, o) });

      Vo({ c1: a, c2: b })(function(err, v) {
        includes(err.message, 'no ms present');
        assert.equal(undefined, v);
        done();
      });
    });

    it('should have consistent & expected error signatures', function() {
      function a (a, b) {
        return 'b'
      }

      function b (a, b, fn) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('b error')
      }

      function * c (err, a, b) {
        assert.equal(a[0], 'b')
        assert.equal(a[1].message, 'b error')
        assert.equal(b, 'b')
        assert.equal(err.message, 'b error')
        return 'c'
      }

      return Vo([a, b], Vo.catch(c))('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['c', 'b'])
        })
    })
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
          assert.deepEqual(v, ['c', 'b'])
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
          assert.deepEqual(v, ['c', 'b'])
        })
    })
  })

  describe('vo(...).bind(...)', function() {
    it('should work with bind', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'a'
      }

      function b (d, a) {
        assert.equal(d, 'd')
        assert.equal(a, 'a')
        return 'b'
      }

      function c (d, a) {
        assert.equal(d, 'd')
        assert.equal(a, 'a')
        return 'c'
      }

      return Vo([b, c]).bind(null, 'd')('a', 'b').then(function (v) {
        assert.deepEqual(v, [['b', 'c'], 'a', 'b'])
      })
    })

    it('bound functions should work with catch', function() {
      var called = 0

      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('oh noz!')
        return 'a'
      }

      function b (d, a) {
        called++
        return 'b'
      }

      function c (d, a) {
        called++
        return 'c'
      }

      function d (err) {
        includes(err.message, 'oh noz!')
        return ['b', 'c']
      }

      return Vo(a, Vo([b, c]).bind(null, 'd'), Vo.catch(d))('a', 'b')
        .then(function (v) {
          assert.equal(called, 0)
          assert.deepEqual(v, [['b', 'c'], 'b'])
        })
    })
  })

  describe('.bind()', function() {
    it('should work with bound generators', function() {
      function * a (binding, msg) {
        assert.equal(this.ctx, 'context')
        assert.equal(binding, 'binding')
        assert.equal(msg, 'hi')
        return 'all done'
      }

      return Vo(bind(a, { ctx: 'context' }, 'binding'))('hi')
        .then(v => assert.equal(v, 'all done'))
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

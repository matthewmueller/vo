/**
 * Module Dependencies
 */

var assert = require('assert')
var vo = require('..')

/**
 * vo.catch
 */

describe('vo.catch(fn)', function() {
  describe('series', function() {
    it('should catch errors thrown in above middleware', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('oh noes!')
      }

      function b (err, a, b, fn) {
        assert.equal(err.message, 'oh noes!')
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        fn(null, 'c')
      }

      function c (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'd'
      }

      return vo(a, vo.catch(b), c)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })

    it('should support rethrowing and recatching', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('oh noes!')
      }

      function b (err, a, b, fn) {
        assert.equal(err.message, 'oh noes!')
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        fn(null, 'c')
      }

      function c (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('blowin up')
        return 'd'
      }

      function d (a, b) {
        throw new Error('wtf!')
      }

      function e (err, a, b) {
        assert.equal(err.message, 'blowin up')
        assert.equal(a, 'a')
        assert.equal(b, 'b')
      }

      return vo(a, vo.catch(b), c, d, vo.catch(e))('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })

    it('should not call catch functions if there\'s no error', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'b'
      }

      function b (err, a, b, fn) {
        throw new Error('should not have been called')
        fn(null, 'c')
      }

      function c (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'c'
      }

      return vo(a, vo.catch(b), c)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })

    it('should support catching parallel functions', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
      }

      function b (a, b, fn) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        fn(new Error('oh noes!!'))
      }

      function c (err, a, b) {
        assert.equal(err.message, 'oh noes!!')
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        return 'd'
      }

      return vo([a, b], vo.catch(c))('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, ['a', 'b'])
        })
    })
  })

  describe('pipeline', function() {
    it('should catch errors thrown in above middleware', function() {
      function a (a, b) {
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        throw new Error('oh noes!')
      }

      function b (err, fn) {
        assert.equal(err.message, 'oh noes!')
        fn(null, 'c')
      }

      function c (c) {
        assert.equal(c, 'c')
        return 'd'
      }

      return vo.pipeline(a, vo.catch(b), c)('a', 'b')
        .then(function (v) {
          assert.deepEqual(v, 'd')
        })
    })
  })
})


4.0.2 / 2016-06-28
==================

  * reduce build size and update readme

4.0.1 / 2016-06-28
==================

  * add exit early
  * pipeline examples

4.0.0 / 2016-06-28
==================

  * add any promise dep
  * use a consistent signature for both pipeline and stack

3.1.1 / 2016-03-17
==================

  * runtime: remove returning a value

3.1.0 / 2016-03-17
==================

  * only patch the files passed in as arguments

3.0.6 / 2016-03-17
==================

  * :sparkles: added a runtime to vo to use generators top-level :sparkles:

3.0.5 / 2016-03-11
==================

  * replace err-candy with combine-errors
  * add bind test and update readme

3.0.4 / 2016-03-02
==================

  * return immediately if we don't have any pending values

3.0.3 / 2016-03-02
==================

  * objects should pass through null values
  * add tests for passing through literals

3.0.2 / 2016-02-29
==================

  * add promise polyfill for IE support

3.0.1 / 2016-02-29
==================

  * support passing literals through vo(5) that just flow through (like promise.resolve(5))

3.0.0 / 2016-02-20
==================

  * revert vo() to be a pipeline flow. use vo.stack() to be for middleware-style flows

2.0.0 / 2016-02-13
==================

  * new API: vo(a, b), vo.pipeline(a, b, c), vo.catch(fn)

1.0.3 / 2015-06-02
==================

  * add: vo.catch(fn|gen)

1.0.2 / 2015-05-01
==================

  * added: `foreach` (@tunnckoCore)
  * use strict, strict comparisons (@tunnckoCore)
  * 200 LOC (@tunnckoCore)

1.0.1 / 2015-04-30
==================

  * support thunks

1.0.0 / 2015-04-30
==================

  * Initial release

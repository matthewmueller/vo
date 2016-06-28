/**
 * Module Dependencies
 */

let http = require('popsicle')
let assert = require('assert')
let vo = require('..')

/**
 * Pipeline
 */

function * get (url) {
  return yield http.get(url)
}

function status (res, params) {
  return res.status
}

let jack = vo(get, status)('http://standupjack.com')
let google = vo(get, status)('https://google.com')

vo([ jack, google ])
.then(out => console.log('out', out))
.catch(e => console.error(e))

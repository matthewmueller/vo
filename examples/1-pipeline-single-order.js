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

function status (res) {
  return res.status
}

vo(get, status)('https://standupjack.com')
  .then(status => console.log(status))
  .catch(e => console.error(e))

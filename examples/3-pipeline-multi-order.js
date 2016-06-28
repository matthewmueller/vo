/**
 * Module Dependencies
 */

let http = require('popsicle')
let assert = require('assert')
let vo = require('..')

/**
 * Pipeline
 */

function * get (url, params) {
  return yield http.get(url)
}

function status (response, params) {
  return response.status
}

vo(get, status)('https://standupjack.com', { params: 'pay' })
.then(out => console.log(out))
.catch(e => console.error(e))

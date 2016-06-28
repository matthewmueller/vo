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

function statuses (responses) {
  return responses.map(res => res.status)
}

vo([
  get('https://standupjack.com'),
  get('https://google.com')
], statuses)
.then(statuses => console.log(statuses))
.catch(e => console.error(e))

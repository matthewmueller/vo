/**
 * Module Dependencies
 */

let http = require('popsicle')
let assert = require('assert')
let vo = require('..')

/**
 * Pipeline
 */

function get (urls, params) {
  return Promise.all(urls.map(url => http.get(url)))
}

function statuses (responses, params) {
  return responses.map(res => res.status)
}

vo(get, statuses)([
  'https://standupjack.com',
  'https://google.com'
], { params: 'pay' })
.then(out => console.log(out))
.catch(e => console.error(e))

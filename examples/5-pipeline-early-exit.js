/**
 * Module Dependencies
 */

let http = require('popsicle')
let assert = require('assert')
let vo = require('..')

/**
 * Pipeline
 */

function exists (file, params) {
  if (!file.contents) return null
  return file
}

function size (file, params) {
  // not called, otherwise it would throw
  return '(' + file.contents + ')'
}

vo(exists, size)({ contents: null }, { overwrite: true })
  .then(out => console.log(out))
  .catch(e => console.error(e))

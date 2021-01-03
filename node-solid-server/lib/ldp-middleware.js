module.exports = LdpMiddleware

const express = require('express')
const header = require('./header')
const allow = require('./handlers/allow')
const allowRefined = require('./handlers/allow-refined')
const get = require('./handlers/get')
const post = require('./handlers/post')
const put = require('./handlers/put')
const del = require('./handlers/delete')
const patch = require('./handlers/patch')
const index = require('./handlers/index')
const copy = require('./handlers/copy')
const time = require('./handlers/timer')

function LdpMiddleware (corsSettings) {
  const router = express.Router('/')

  // Add Link headers
  router.use(header.linksHandler)

  if (corsSettings) {
    router.use(corsSettings)
  }

  router.copy('/*', allow('Write'), allowRefined('Write', true), copy)
  router.get('/*', index, time(0), allow('Read'), time(1), header.addPermissions, time('header'), allowRefined('Read', false), time(2), get, time(3))
  //router.get('/*', index, time(0), allow('Read'), time(1), allowRefined('Read', false), time(2), get, time(3))

  router.post('/*', time(0), allow('Append'), time(1), allowRefined('Append',false), time(2), post, time(3))
  router.patch('/*',  time(0), allow('Append'), time(1), allowRefined('Append', false),time(2), patch, time(3))
  router.put('/*', time(0), allow('Write'), time(1), allowRefined('Append', false), time(2), put, time(3))
  router.delete('/*', time(0), allow('Write', true), time(1), allowRefined('Write', false), time(2), del, time(3))

  return router
}

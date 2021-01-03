module.exports = handler

const bodyParser = require('body-parser')
const debug = require('debug')('solid:put')
const getContentType = require('../utils').getContentType
const isAuthorized = require('../utils').isAuthorized
const canAppendStream = require('../utils').canAppendStream
const HTTPError = require('../http-error')
const { stringToStream, N3Store } = require('../utils')
const LDP = require('../ldp')
const Stream = require('stream')
const utilPath = require('path')
const N3 = require('n3')
const performance = require('perf_hooks').performance


async function handler (req, res, next) {
  debug(req.originalUrl)
  res.header('MS-Author-Via', 'SPARQL')

  const contentType = req.get('content-type')
  if (LDP.mimeTypeIsRdf(contentType) && isAclFile(req)) {
    return bodyParser.text({ type: () => true })(req, res, () => putAcl(req, res, next))
  }
  return putStream(req, res, next)
}

async function putStream (req, res, next, stream = req) {
  const ldp = req.app.locals.ldp
  const user = req.session.userId
  const stream1 = req.pipe(new Stream.PassThrough())
  const stream2 = req.pipe(new Stream.PassThrough())
  let resourcePath = req.path

  debug('req.url: '+req.url )
  try {
    let t1 = performance.now()
    const hasFullAccess = await req.acl.can(user, 'Write')
    let t2 = performance.now()
debug('req.acl.can: '+(t2-t1)+'ms')
    if(!hasFullAccess) {
      const contentType = req.get('content-type')
      if(contentType != 'text/turtle'){
        const error = await req.acl.getError(user, 'Write')
        debug('Fine grained access only supports Turtle')
        throw error
      }

      // Check the fine grained access rights
      let exists = true
      try {
        await ldp.exists(req.hostname, resourcePath)
      } catch (err) {
        debug('file doesn\'t exist yet')
        exists = false
      }
      debug('exists ? ' +exists)
      let writeTime = 0
      let appendTime = 0
      if (exists) {
        const hasRefinedWriteAccess = await req.acl.canRefined(user, 'Write')
        if(!hasRefinedWriteAccess){
          // No form of Write access and a file will be overwritten
          const error = await req.acl.getError(user, 'Write')
          throw error
        }
        // Check fine grained Write access on file to be overwritten
        let t3 = performance.now()
        let path
        const url = req
        try {
          ({path} = await ldp.resourceMapper.mapUrlToFile({url}))
        } catch (err) {
          debug(err)
        }
        const store = await N3Store(path)
        const allowed = await isAuthorized(req, 'Write', store)
        debug('can overwrite ? '+allowed)
        let t4 = performance.now()
        writeTime = t4 - t3
        debug('checking if can overwrite took '+writeTime)
        if(!allowed){
          req.times.acInHandler = writeTime
          const error = await req.acl.getError(user, 'Write')
          throw error
        }
      }

      const t5 = performance.now()
      //if (req.acl.hasRefinedAccess(user, 'Append')) {
        // Append access is enough, because it is first checked whether PUT overwrites a file (needing Write access)
        const allowed = await canAppendStream(req, stream1)
        const t6 = performance.now()
        appendTime = t6 - t5
        debug('can append ? '+allowed)
        debug('checking if can write took '+appendTime)
        req.times.acInHandler = appendTime + writeTime
        if(!allowed){
          const error = await req.acl.getError(user, 'Write')
          throw error
        }
      //}
    }

    await ldp.put(req, stream2, getContentType(req.headers))
    debug('succeeded putting the file')
    res.sendStatus(201)
    return next()
  } catch (err) {
    debug('error putting the file: ' + err.message)
    err.message = 'Can\'t write file: ' + err.message
    return next(err)
  }
}

function putAcl (req, res, next) {
  const ldp = req.app.locals.ldp
  const contentType = req.get('content-type')
  const requestUri = ldp.resourceMapper.getRequestUrl(req)

  if (ldp.isValidRdf(req.body, requestUri, contentType)) {
    const stream = stringToStream(req.body)
    return putStream(req, res, next, stream)
  }
  next(new HTTPError(400, 'RDF file contains invalid syntax'))
}

function isAclFile (req) {
  const originalUrlParts = req.originalUrl.split('.')
  return originalUrlParts[originalUrlParts.length - 1] === 'acl'
}

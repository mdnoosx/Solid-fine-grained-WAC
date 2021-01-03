module.exports = allowRefined

const ACL = require('../acl-checker')
const debug = require('debug')('solid:ACL')
const performance = require('perf_hooks').performance

// Checks if any additional fine-grained access control policies apply to the resource
function allowRefined (mode, skipFineGrainedAC) {
  return async function allowRefinedHandler(req, res, next) {
      const t1 = performance.now()
      const ldp = req.app.locals.ldp || {}
      // todo: ?
      if (!ldp.webid) {
          return next()
      }
      const userId = req.session.userId

      // Check if access already allowed
      //debug('req.authError: '+req.authError)
      //todo: req.authError unauthenticated set falsely somewhere
      //const error = req.authError || await req.acl.getError(userId, mode)
      const error =  await req.acl.getError(userId, mode)
      //debug('error cached in can: '+error+' / userid, mode: '+ userId+', '+mode+' for resource: '+req.acl.resource)
      if(!error) {
          debug('no error, calling next handler')
          return next()
      }

      // No further access control checks
      if(skipFineGrainedAC){
          return next(error)
      }

      // todo: Check for non unauthenticated/unauthorized errors
      const t2 = performance.now()
   // debug('allow-refined setup: '+(t2-t1)+'ms')
      // Check for fine-grained access
      const ret = await req.acl.canRefined(userId, mode)
      const isAllowed = ret.ok
      req.times.parsingACLs = ret.timingParsing
      req.times.findingFilters = ret.timingFindingFilters
      debug('canRefined: '+isAllowed)

      if(isAllowed){
          return next()
      }

      if(error) {
          debug('error: '+error)
          return next(error)
      }else{
          debug('shouldn\'t happen')
          return next('shouldn\'t happen')
      }
   }
}

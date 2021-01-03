'use strict'

const rdf = require('rdflib')
const performance = require('perf_hooks').performance
const debug = require('debug')('solid:ACL')
const debug2 = require('debug')('solid:refACL')
const HTTPError = require('./http-error')
const aclCheck = require('@solid/acl-check')
const refinedAclCheck = require('./refined-acl-check')
const {URL} = require('url')
const {promisify} = require('util')
const fs = require('fs')
const Url = require('url')
const httpFetch = require('node-fetch')

const DEFAULT_ACL_SUFFIX = '.acl'
const ACL = rdf.Namespace('http://www.w3.org/ns/auth/acl#')

// An ACLChecker exposes the permissions on a specific resource
class ACLChecker {
    constructor(resource, options = {}) {
        this.resource = resource
        this.resourceUrl = new URL(resource)
        this.agentOrigin = options.strictOrigin && options.agentOrigin ? rdf.sym(options.agentOrigin) : null
        this.fetch = options.fetch
        this.fetchGraph = options.fetchGraph
        this.trustedOrigins = options.strictOrigin && options.trustedOrigins ? options.trustedOrigins.map(trustedOrigin => rdf.sym(trustedOrigin)) : null
        this.suffix = options.suffix || DEFAULT_ACL_SUFFIX
        this.aclCached = {}
        this.messagesCached = {}
        this.requests = {}
        this.filtersCached = {}
        this.userFiltersCached = {}
        this.originFiltersCached = {}
        this.slug = options.slug
        this.userOk = {}
        this.originOk = {}
        this.userTest = options.userTest
    }

    // Returns a fulfilled promise when the user can access the resource
    // in the given mode, or rejects with an HTTP error otherwise
    async can(user, mode) {
        const t0 = performance.now()

        //console.log('can(' + user + ', ' + mode + ') called for '+this.resource)
        if (this.userTest == 'alice') {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }

        const cacheKey = `${mode}-${user}`
        if (this.aclCached[cacheKey]) {
            debug('acl cached')
            return this.aclCached[cacheKey]
        }
        this.messagesCached[cacheKey] = this.messagesCached[cacheKey] || []

        const subt1 = performance.now()
        const acl = await this.getNearestACL().catch(err => {
            this.messagesCached[cacheKey].push(new HTTPError(err.status || 500, err.message || err))
            debug('error getting nearest acl: ' + err)
        })
        const subt2 = performance.now()
        debug('CAN: getNearestAcl(): ' + (subt2 - subt1) + 'ms')
        if (!acl) {
            this.aclCached[cacheKey] = Promise.resolve(false)
            return this.aclCached[cacheKey]
        }

        let resource = rdf.sym(this.resource)
        if (this.resource.endsWith('/' + this.suffix)) {
            resource = rdf.sym(ACLChecker.getDirectory(this.resource))
        }
        // If this is an ACL, Control mode must be present for any operations
        if (this.isAcl(this.resource)) {
            mode = 'Control'
            resource = rdf.sym(this.resource.substring(0, this.resource.length - this.suffix.length))
        }
        // If the slug is an acl, reject
        if (this.isAcl(this.slug)) {
            this.aclCached[cacheKey] = Promise.resolve(false)
            return this.aclCached[cacheKey]
        }

        const directory = acl.isContainer ? rdf.sym(ACLChecker.getDirectory(acl.acl)) : null
        const aclFile = rdf.sym(acl.acl)
        const agent = user ? rdf.sym(user) : null
        const modes = [ACL(mode)]

        const agentOrigin = this.agentOrigin
        // trusted origin from server settings
        const trustedOrigins = this.trustedOrigins
        // trusted origin modes from owner's profile
        let originTrustedModesOwners = []
        try {
            const t1 = performance.now()
            //      debug('setup time: '+(t1-t0)+'ms')
            this.fetch(aclFile.doc().value)
            const t2 = performance.now()
            originTrustedModesOwners = await aclCheck.getTrustedModesForOrigin(acl.graph, resource, directory, aclFile, agentOrigin, (uriNode) => {
                return this.fetch(uriNode.doc().value, acl.graph)
            })
            const t3 = performance.now()
            debug('CAN: aclCheck.getTrustedModesForOrigin: ' + (t3 - t2) + 'ms')

        } catch (e) {
            // FIXME: https://github.com/solid/acl-check/issues/23
            debug('error fetching nearest acl: ' + e)
        }
        const t4 = performance.now()
        let accessDenied = aclCheck.accessDenied(acl.graph, resource, directory, aclFile, agent, modes, agentOrigin, trustedOrigins, originTrustedModesOwners)
        const t5 = performance.now()
        debug('CAN: aclCheck.accessDenied: ' + (t5 - t4) + 'ms')

        // Check if origin is allowed (needed for refined-acl-check and because of bug acl-check)
        const originOk = this.originApproved(mode, acl.graph, resource, aclFile, agentOrigin, trustedOrigins, originTrustedModesOwners)
        const t6 = performance.now()
        debug('CAN: my originApproved: ' + (t6 - t5) + 'ms')
        this.originOk[cacheKey] = originOk
        if (accessDenied == 'Origin Unauthorized' && originOk) {
            debug('origin auths bug fix')
            accessDenied = false
        }
        if (accessDenied && user) {
            this.messagesCached[cacheKey].push(HTTPError(403, accessDenied))
        } else if (accessDenied) {
            this.messagesCached[cacheKey].push(HTTPError(401, 'Unauthenticated'))
        }
        //debug('messages cached: ')
        //debug(this.messagesCached[cacheKey])
        this.aclCached[cacheKey] = Promise.resolve(!accessDenied)
        //debug('can returned: '+!accessDenied+' for resource '+resource)
        return this.aclCached[cacheKey]
    }

    async canRefined(user, mode) {
        const t0 = performance.now()
        if (this.userTest == 'alice') {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }
        debug('canRefined(' + user + ', ' + mode + ') called for ' + this.resource)
        const cacheKey = `${mode}-${user}`
        if (this.filtersCached[cacheKey]) {
            return this.filtersCached[cacheKey]
        }

        // Only check fine grained access rights for documents
        if (this.resource.endsWith('/') && mode == 'Read') {
            debug2("Reading container: no fine grained access")
            this.filtersCached[cacheKey] = Promise.resolve(false)
            return this.filtersCached[cacheKey]
        }
        if (this.isAcl(this.resource)) {
            // policy propagation not allowed: deny access
            this.filtersCached[cacheKey] = Promise.resolve(false)
            return this.filtersCached[cacheKey]
        }

        // Find existing ACL files
        const acls = this.getPossibleACLs()
        const graph = rdf.graph()

        this.parsingtime = 0
        this.fetchingtime = 0

        const t1 = performance.now()
        //  debug('setup: '+(t1-t0)+'ms')
        debug('acls:')
        debug(acls)
        await Promise.all(acls.map(acl => {
            return this.fetch(acl, graph, false, false)
        }))

        const t3 = performance.now()
        debug2('fetching and parsing acl files: ' + (t3 - t1) + 'ms')
        const parsingandFetchingTime = (t3 - t1)

        const agent = user ? rdf.sym(user) : null
        const agentOrigin = this.agentOrigin
        // Check if user has full access to file
        let userOk = false
        if (this.messagesCached && this.messagesCached[cacheKey].toString() == (HTTPError(403, 'Origin Unauthorized')).toString()) {
            userOk = true
        }
        this.userOk[cacheKey] = userOk
        let {resource: uri, suffix} = this

        const t4 = performance.now()
        let userFilters, originFilters
        [userFilters, originFilters] = await refinedAclCheck.accessRights(graph, uri, agent, ACL(mode), agentOrigin, userOk, this.originOk[cacheKey])
        const t5 = performance.now()

        debug2('finding filters: ' + (t5 - t4) + 'ms')
        const findingFiltersTime = t5 - t4
        /*
        debug('userfilters: ' + userFilters.length)
        debug('originFilters: '+originFilters.length)
        debug('userOk: '+this.userOk[cacheKey])
        debug('originOk: '+this.originOk[cacheKey])
        debug2('userfilters:')
        userFilters.forEach(f => debug(f))
        debug2('originfilters:')
        originFilters.forEach(f => debug(f))
         */
        const noFilteredAccess = (userFilters.length == 0 && originFilters.length == 0) ||
            (userFilters.length == 0 && !userOk) ||
            (originFilters.length == 0 && !this.originOk[cacheKey])
        if (noFilteredAccess) {
            this.filtersCached[cacheKey] = Promise.resolve(false)
            return this.filtersCached[cacheKey]
        }
        this.userFiltersCached[cacheKey] = userFilters
        this.originFiltersCached[cacheKey] = originFilters
        this.filtersCached[cacheKey] = Promise.resolve(true)
        return {ok: this.filtersCached[cacheKey], timingParsing: parsingandFetchingTime, timingFindingFilters: findingFiltersTime}
    }

    // Check if origin has access to entire document
    originApproved(modeRequested, graph, resource, aclFile, origin, trustedOrigins, originModesOwner) {
        let modes = ACL(modeRequested)
        let originOk = false

        // If no origin specified: origin ok
        if (!origin) {
            originOk = true
        }
        // Check origin authorisations in ACL file
        let auths = graph.each(null, ACL('accessTo'), resource, aclFile)
        auths.forEach(auth => {
            if (graph.holds(auth, ACL('origin'), origin, aclFile) && graph.holds(auth, ACL('mode'), modes, aclFile)) {
                originOk = true
            }
        })
        // Check origin authorisations from owner's profile
        if (originModesOwner && this.nodesIncludeNode(originModesOwner, modes)) {
            originOk = true
        }
        // Check origin authorisations from server settings
        if (origin && trustedOrigins && this.nodesIncludeNode(trustedOrigins, origin)) {
            originOk = true
        }
        // Write access grants append access as well
        if (!originOk && modes.value === (ACL('Append')).value) {
            if (this.originApproved('Write', graph, resource, aclFile, origin, trustedOrigins, originModesOwner)) {
                originOk = true
            }
        }
        return originOk
    }

    nodesIncludeNode(nodes, node) {
        return nodes.some(trustedOrigin => trustedOrigin.termType === node.termType && trustedOrigin.value === node.value);
    }

    async getError(user, mode) {
        // todo: get rid of this, probably cause of problems with browser
        if (this.userTest) {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }
        const cacheKey = `${mode}-${user}`
        this.aclCached[cacheKey] = this.aclCached[cacheKey] || this.can(user, mode)
        const isAllowed = await this.aclCached[cacheKey]
        return isAllowed ? null : this.messagesCached[cacheKey].reduce((prevMsg, msg) => msg.status > prevMsg.status ? msg : prevMsg, {status: 0})
    }

    hasRefinedAccess(user, mode) {
        if (this.userTest) {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }
        const cacheKey = `${mode}-${user}`
        return this.filtersCached[cacheKey]
    }

    hasFullAccess(user, mode) {
        if (this.userTest) {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }
        const cacheKey = `${mode}-${user}`
        return [this.userOk[cacheKey], this.originOk[cacheKey]]
    }

    getFilters(user, mode) {
        if (this.userTest) {
            user = 'https://alice.localhost:8443/profile/card#me'
        }
        if (this.userTest == 'bob') {
            user = 'https://bob.localhost:8443/profile/card#me'
        }
        const cacheKey = `${mode}-${user}`
        if (!this.filtersCached[cacheKey]) {
            //todo: execute checks if not called before ?


            debug('getFilters called before checking fine grained access rights for user: ' + user + ', mode: ' + mode)
        }
        let filters = [this.userFiltersCached[cacheKey], this.originFiltersCached[cacheKey]]
        return filters
    }

    static getDirectory(aclFile) {
        const parts = aclFile.split('/')
        parts.pop()
        return `${parts.join('/')}/`
    }

    // Gets the ACL that applies to the resource
    async getNearestACL() {
        const {resource} = this
        let isContainer = false
        const possibleACLs = this.getPossibleACLs()
        const acls = [...possibleACLs]
        let returnAcl = null

        while (possibleACLs.length > 0 && !returnAcl) {
            const acl = possibleACLs.shift()
            let graph
            try {
                this.requests[acl] = this.requests[acl] || this.fetch(acl)
                graph = await this.requests[acl]
            } catch (err) {
                if (err && (err.code === 'ENOENT' || err.status === 404)) {
                    isContainer = true
                    continue
                }
                debug(err)
                throw err
            }
            const relative = resource.replace(acl.replace(/[^/]+$/, ''), './')
            returnAcl = {acl, graph, isContainer}
        }
        if (!returnAcl) {
            throw new HTTPError(500, `No ACL found for ${resource}, searched in \n- ${acls.join('\n- ')}`)
        }
        const groupNodes = returnAcl.graph.statementsMatching(null, ACL('agentGroup'), null)
        const groupUrls = groupNodes.map(node => node.object.value.split('#')[0])
        await Promise.all(groupUrls.map(groupUrl => {
            this.requests[groupUrl] = this.requests[groupUrl] || this.fetch(groupUrl, returnAcl.graph)
            return this.requests[groupUrl]
        }))

        return returnAcl
    }

    // Gets all possible ACL paths that apply to the resource
    getPossibleACLs() {
        // Obtain the resource URI and the length of its base
        let {resource: uri, suffix} = this
        const [{length: base}] = uri.match(/^[^:]+:\/*[^/]+/)

        // If the URI points to a file, append the file's ACL
        const possibleAcls = []
        if (!uri.endsWith('/')) {
            possibleAcls.push(uri.endsWith(suffix) ? uri : uri + suffix)
        }

        // Append the ACLs of all parent directories
        for (let i = lastSlash(uri); i >= base; i = lastSlash(uri, i - 1)) {
            possibleAcls.push(uri.substr(0, i + 1) + suffix)
        }
        return possibleAcls
    }

    isAcl(resource) {
        return resource.endsWith(this.suffix)
    }

    static createFromLDPAndRequest(resource, ldp, req) {
        const trustedOrigins = ldp.getTrustedOrigins(req)
        return new ACLChecker(resource, {
            userTest: false,
           // userTest: 'alice', // owner
           // userTest: 'bob', // allowed write access in public/.acl and samplecontainer
            agentOrigin: req.get('origin'),
            //agentOrigin: 'https://test.local', // allowed read in example1.ttl.acl
            //agentOrigin: 'https://testwide.local',  // allowed in card$.ttl
            //agentOrigin: 'https://alice.localhost:8443', // allowed by server settings
            //agentOrigin: 'https://originrefined.local', // partially allowed in public/.acl
           // agentOrigin: 'https://notallowed.local',
            fetch: fetchLocalOrRemote(ldp.resourceMapper, ldp.serverUri),
            fetchGraph: (uri, options) => {
                // first try loading from local fs
                return ldp.getGraph(uri, options.contentType)
                    // failing that, fetch remote graph
                    .catch(() => ldp.fetchGraph(uri, options))
            },
            suffix: ldp.suffixAcl,
            strictOrigin: ldp.strictOrigin,
            trustedOrigins,
            slug: decodeURIComponent(req.headers['slug'])
        })
    }
}

/**
 * Returns a fetch document handler used by the ACLChecker to fetch .acl
 * resources up the inheritance chain.
 * The `fetch(uri, callback)` results in the callback, with either:
 *   - `callback(err, graph)` if any error is encountered, or
 *   - `callback(null, graph)` with the parsed RDF graph of the fetched resource
 * @return {Function} Returns a `fetch(uri, callback)` handler
 */
function fetchLocalOrRemote(mapper, serverUri) {
    return async function fetch(url, graph = rdf.graph(), returnBody = false, throwError = true) {
        // Convert the URL into a filename
        let body, contentType, path

        const t1 = performance.now()
        if (Url.parse(url).host.includes(Url.parse(serverUri).host)) {
            // Fetch the acl from local
            try {
                ({path, contentType} = await mapper.mapUrlToFile({url}))
            } catch (err) {
                debug('error mapping acl: '+err)
                if (throwError) {
                    throw new HTTPError(404, err)
                } else{
                    if(!returnBody)
                        debug('so returning untouched graph')
                        return graph
                }
            }
            // Read the file from disk
            debug('fetching local or remote: '+path)
            body = await promisify(fs.readFile)(path, {'encoding': 'utf8'})
        } else {
            // Fetch the acl from the internet
            const response = await httpFetch(url)
            body = await response.text()
            contentType = response.headers.get('content-type')
        }
        if (returnBody) {
            return {
                body: body,
                url: url
            }
        }
        // Parse the file as Turtle
        //debug(body)
        const t2 = performance.now()

        rdf.parse(body, graph, url, contentType)
        const t3 = performance.now()
        //debug2('fetching acl files: ' + (t2 - t1) + 'ms')
        //debug('parsing acl files: ' + (t3 - t2) + 'ms')
        return graph
    }
}

// Returns the index of the last slash before the given position
function lastSlash(string, pos = string.length) {
    return string.lastIndexOf('/', pos)
}

module.exports = ACLChecker
module.exports.DEFAULT_ACL_SUFFIX = DEFAULT_ACL_SUFFIX
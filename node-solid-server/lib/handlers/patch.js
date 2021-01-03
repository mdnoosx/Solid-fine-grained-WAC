// Express handler for LDP PATCH requests

module.exports = handler

const bodyParser = require('body-parser')
const fs = require('fs')
const fx = require('mkdir-recursive')
const debug2 = require('debug')('solid:patch2')
const debug1 = require('debug')('solid:patch1')
const debug = require('../debug').handlers
const error = require('../http-error')
const $rdf = require('../../../altrdflib/lib/index.js')
const N3 = require('n3')
const crypto = require('crypto')
const overQuota = require('../utils').overQuota
const getContentType = require('../utils').getContentType
const streamToN3Store = require('../utils').streamToN3Store
const filterGraph = require('../utils').filterGraph
const isAuthorized = require('../utils').isAuthorized
const withLock = require('../lock')
const performance = require('perf_hooks').performance


const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

// Patch parsers by request body content type
const PATCH_PARSERS = {
    'application/sparql-update': require('./patch/sparql-update-parser.js'),
    'text/n3': require('./patch/n3-patch-parser.js')
}

const DEFAULT_FOR_NEW_CONTENT_TYPE = 'text/turtle'

// Handles a PATCH request
async function patchHandler(req, res, next) {
    debug(`PATCH -- ${req.originalUrl}`)
    res.header('MS-Author-Via', 'SPARQL')
    try {
        // Obtain details of the target resource
        const ldp = req.app.locals.ldp
        let path, contentType
        try {
            // First check if the file already exists
            ({path, contentType} = await ldp.resourceMapper.mapUrlToFile({url: req}))
        } catch (err) {
            // If the file doesn't exist, request one to be created with the default content type
            ({path, contentType} = await ldp.resourceMapper.mapUrlToFile(
                {url: req, createIfNotExists: true, contentType: DEFAULT_FOR_NEW_CONTENT_TYPE}))
        }
        const {url} = await ldp.resourceMapper.mapFileToUrl({path, hostname: req.hostname})
        const resource = {path, contentType, url}
        debug('PATCH -- Target <%s> (%s)', url, contentType)

        // Obtain details of the patch document
        const patch = {}
        patch.text = req.body ? req.body.toString() : ''
        patch.uri = `${url}#patch-${hash(patch.text)}`
        patch.contentType = getContentType(req.headers)
        debug('PATCH -- Received patch (%d bytes, %s)', patch.text.length, patch.contentType)
        const parsePatch = PATCH_PARSERS[patch.contentType]
        if (!parsePatch) {
            throw error(415, `Unsupported patch content type: ${patch.contentType}`)
        }

        // Parse the patch document and verify permissions
        const patchObject = await parsePatch(url, patch.uri, patch.text)
        const t1 = performance.now()

        const modesRefinedAccess = await checkPermission(req, patchObject)
        const t2 = performance.now()
        debug2('checkPermissions: '+(t2-t1)+'ms')

        // Check to see if folder exists
        const pathSplit = path.split('/')
        const directory = pathSplit.slice(0, pathSplit.length - 1).join('/')
        if (!fs.existsSync(directory)) {
            fx.mkdirSync(directory, {recursive: true})
        }
       // const t3 = performance.now()

        // Patch the graph and write it back to the file
        const result = await withLock(path, {mustExist: false}, async () => {

            const fileContents = await readGraph(resource)
            const subt0 = performance.now()
            const graph = await parseGraph(req, resource, fileContents, modesRefinedAccess.includes('Read'))
            const subt1 = performance.now()
            debug('parsing graph: '+(subt1-subt0) + 'ms')
            await applyPatch(patchObject, graph, url)
            const subt2 = performance.now()
            debug('applying patch: '+(subt2-subt1) + 'ms')

            const refinedAppend = modesRefinedAccess.includes('Append')
            const refinedWrite = modesRefinedAccess.includes('Write')
            let user = req.session.userId
            const t1 = performance.now()
            if(refinedAppend){
                const insertStore = await statementsToN3Store(patchObject.inserted)
                const allowed = await isAuthorized(req, 'Append', insertStore)
                if(!allowed){
                    debug('INSERT not allowed')
                    const error = await req.acl.getError(user, 'Append')
                    throw error
                }
            }
            const t2 = performance.now()
            if(refinedWrite){
                const deleteStore = await statementsToN3Store(patchObject.deleted)
                const allowed = await isAuthorized(req, 'Write', deleteStore)
                if(!allowed){
                    debug('DELETE not allowed')
                    const error = await req.acl.getError(user, 'Write')
                    throw error
                }
            }
            const t3 = performance.now()
            debug2('patch: ac in handler: checking insert statements: '+(t2-t1)+'ms')
            debug2('patch: ac in handler: checking delete statements: '+(t3-t2)+'ms')
            req.times.acInHandler += (t3 - t1)

            return writeGraph(graph, resource, ldp.resourceMapper.resolveFilePath(req.hostname), ldp.serverUri)
        })

        // Send the result to the client
        res.send(result)
    } catch (err) {
        debug2('error in patchHandler: ' + err)
        return next(err)
    }
    return next()
}

// Reads the request body and calls the actual patch handler
function handler(req, res, next) {
    readEntity(req, res, () => patchHandler(req, res, next))
}

const readEntity = bodyParser.text({type: () => true})

function statementsToN3Store(statements){
    const store = new N3.Store()
    statements.forEach(statement =>{
        const subject = namedNode(statement.subject.value)
        const predicate = namedNode(statement.predicate.value)
        let object
        if(statement.object.termType == 'NamedNode'){
            object = namedNode(statement.object.value)
        }else{
            object = literal(statement.object.value)
        }
        store.addQuad(subject, predicate, object)
    })
    return store
}

// Reads the RDF graph in the given resource
function readGraph(resource) {
    // Read the resource's file
    return new Promise((resolve, reject) => {
            fs.readFile(resource.path, {encoding: 'utf8'}, function (err, fileContents) {
                if (err) {
                    // If the file does not exist, assume empty contents
                    // (it will be created after a successful patch)
                    if (err.code === 'ENOENT') {
                        fileContents = ''
                        debug('empty file in ' + resource.path)
                        // Fail on all other errors
                    } else {
                        return reject(error(500, `Original file read error: ${err}`))
                    }
                }
                debug('PATCH -- Read target file (%d bytes)', fileContents.length)
                resolve(fileContents)
            })
        }
    ).catch(err => debug('ERROR in patch.js in readgraph: ' + err))
}

async function parseGraph(req, resource, fileContents, refinedReadAccess) {
    // Parse the resource's file contents
    if (refinedReadAccess) {
        const t1 = performance.now()
        const store = new N3.Store()
        try {
            const parser = new N3.Parser()
            parser.parse(fileContents, (error, quad, prefixes) => {
                if (quad)
                    store.addQuad(quad)
            })
        } catch (err) {
            throw error(500, `Patch: file syntax error: ${err}`)
        }
        debug('filtering graph')
        //debug2('graph pre filtering:')
        //debug(store)
        fileContents = await filterGraph(req, store, 'Read')
        //debug2('data post filtering:')
        //debug(fileContents)
        const t2 = performance.now()
        debug2('patch: ac in handler: filtering file contents in parsegraph: '+(t2-t1)+'ms')
        req.times.acInHandler += (t2 - t1)
    }
    const t3 = performance.now()
    const graph = $rdf.graph()
    try {
        $rdf.parse(fileContents, graph, resource.url, resource.contentType)
    } catch (err) {
        throw error(500, `Patch: file syntax error: ${err}`)
    }
    const t4 = performance.now()
    debug('parsing file again using rdflib: '+(t4-t3)+'ms')
    debug('PATCH -- Parsed target file')
    // return graph
    return graph

}

// Verifies whether the user is allowed to perform the patch on the target
async function checkPermission(request, patchObject) {
    // If no ACL object was passed down, assume permissions are okay.
    debug2('checking permissions')
    if (!request.acl) {
        // todo: ??, can cause problem ?
        debug2('no acl passed down, granting access')
        return Promise.resolve(patchObject)
    }
    // At this point, we already assume append access,
    // as this can be checked upfront before parsing the patch.
    // Now that we know the details of the patch,
    // we might need to perform additional checks.
    let modes = []
    const {acl, session: {userId}} = request
    // Read access is required for DELETE and WHERE.
    // If we would allows users without read access,
    // they could use DELETE or WHERE to trigger 200 or 409,
    // and thereby guess the existence of certain triples.
    // DELETE additionally requires write access.
    if (patchObject.delete) {
        modes = ['Append', 'Read', 'Write']
        // checks = [acl.can(userId, 'Read'), acl.can(userId, 'Write')]
    } else if (patchObject.where) {
        modes = ['Append', 'Read']
        // checks = [acl.can(userId, 'Read')]
    } else {
        modes = ['Append']
    }
    const t1 = performance.now()
    debug('modes required for patch:')
    debug(modes)
    const allowed = await Promise.all(modes.map(mode => acl.can(userId, mode)))
    const t2 = performance.now()

    debug2('checking for full access: '+(t2-t1)+'ms')

    // Check which modes don't have full access
    const tAC1 = performance.now()
    let noFullAccess = []
    for (var i = 0; i < allowed.length; i++) {
        if (!allowed[i]) {
            noFullAccess.push(modes[i])
        }
    }
    debug2('modes that don\'t have full access:')
    noFullAccess.forEach(m => debug2(m))

    const t3 = performance.now()
    const refinedAllowed = await Promise.all(noFullAccess.map(mode => acl.canRefined(userId, mode)))
    const t4 = performance.now()
    debug2('checking for fine grained access: '+(t4-t3)+'ms')

    const allRefinedAllowed = refinedAllowed.reduce((memo, allowed) => memo && allowed, true)
    const tAC2 = performance.now()
    debug2('patch: refined ac in handler: checking if finegrained access exists: '+(tAC2-tAC1))
    request.times.acInHandler += (tAC2 - tAC1)
    // At least some refined access is needed for each needed mode in order to possibly execute the path
    if (!allRefinedAllowed) {
        const errors = await Promise.all(modes.map(mode => acl.getError(userId, mode)))
        const error = errors.filter(error => !!error)
            .reduce((prevErr, err) => prevErr.status > err.status ? prevErr : err, {status: 0})
        return Promise.reject(error)
    }
    // return modes for which only filtered access is allowed
    return Promise.resolve(noFullAccess)
}

// Applies the patch to the RDF graph
function applyPatch(patchObject, graph, url) {
    debug('PATCH -- Applying patch')
    patchObject.deleted = []
    patchObject.inserted = []
    return new Promise((resolve, reject) =>
        graph.applyPatch(patchObject, graph.sym(url), (err) => {
            if (err) {
                const message = err.message || err // returns string at the moment
                debug(`PATCH -- FAILED. Returning 409. Message: '${message}'`)
                return reject(error(409, `The patch could not be applied. ${message}`))
            }
            resolve(graph)
        })
    )
}

// Writes the RDF graph to the given resource
function writeGraph(graph, resource, root, serverUri) {
    debug('PATCH -- Writing patched file')
    return new Promise((resolve, reject) => {
        const resourceSym = graph.sym(resource.url)
        const serialized = $rdf.serialize(resourceSym, graph, resource.url, resource.contentType)

        // First check if we are above quota
        overQuota(root, serverUri).then((isOverQuota) => {
            if (isOverQuota) {
                return reject(error(413,
                    'User has exceeded their storage quota'))
            }

            fs.writeFile(resource.path, serialized, {encoding: 'utf8'}, function (err) {
                if (err) {
                    return reject(error(500, `Failed to write file after patch: ${err}`))
                }
                debug('PATCH -- applied successfully')
                resolve('Patch applied successfully.\n')
            })
        }).catch(() => reject(error(500, 'Error finding user quota')))
    })
}

// Creates a hash of the given text
function hash(text) {
    return crypto.createHash('md5').update(text).digest('hex')
}

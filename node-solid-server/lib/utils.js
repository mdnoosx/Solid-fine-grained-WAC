module.exports.pathBasename = pathBasename
module.exports.hasSuffix = hasSuffix
module.exports.serialize = serialize
module.exports.translate = translate
module.exports.streamToStore = streamToStore
module.exports.streamToN3Store = streamToN3Store
module.exports.quadStreamToString = quadStreamToString
module.exports.stringToStream = stringToStream
module.exports.quadStreamToStore = quadStreamToN3Store
module.exports.N3StoreToString = N3StoreToString
module.exports.debrack = debrack
module.exports.stripLineEndings = stripLineEndings
module.exports.fullUrlForReq = fullUrlForReq
module.exports.routeResolvedFile = routeResolvedFile
module.exports.getQuota = getQuota
module.exports.overQuota = overQuota
module.exports.getContentType = getContentType
module.exports.parse = parse
module.exports.intersection = intersection
module.exports.filterGraph = filterGraph
module.exports.isAuthorized = isAuthorized
module.exports.N3Store = N3Store
module.exports.canAppendStream = canAppendStream

const fs = require('fs')
const path = require('path')
const util = require('util')
const $rdf = require('rdflib')
const from = require('from2')
const url = require('url')
const debug = require('./debug').fs
const getSize = require('get-folder-size')
var ns = require('solid-namespace')($rdf)
const N3 = require('n3')
const withLock = require("./lock");
const rdfParser = require("rdf-parse").default
const newEngine = require('@comunica/actor-init-sparql').newEngine
const performance = require('perf_hooks').performance
const {promisify} = require('util')

/**
 * Returns a fully qualified URL from an Express.js Request object.
 * (It's insane that Express does not provide this natively.)
 *
 * Usage:
 *
 *   ```
 *   console.log(util.fullUrlForReq(req))
 *   // -> https://example.com/path/to/resource?q1=v1
 *   ```
 *
 * @param req {IncomingRequest}
 *
 * @return {string}
 */
function fullUrlForReq(req) {
    let fullUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: url.resolve(req.baseUrl, req.path),
        query: req.query
    })

    return fullUrl
}

/**
 * Removes the `<` and `>` brackets around a string and returns it.
 * Used by the `allow` handler in `verifyDelegator()` logic.
 * @method debrack
 *
 * @param s {string}
 *
 * @return {string}
 */
function debrack(s) {
    if (!s || s.length < 2) {
        return s
    }
    if (s[0] !== '<') {
        return s
    }
    if (s[s.length - 1] !== '>') {
        return s
    }
    return s.substring(1, s.length - 1)
}

async function parse(data, baseUri, contentType) {
    const graph = $rdf.graph()
    return new Promise((resolve, reject) => {
        try {
            return $rdf.parse(data, graph, baseUri, contentType, (err, str) => {
                if (err) {
                    return reject(err)
                }
                resolve(str)
            })
        } catch (err) {
            return reject(err)
        }
    })
}

function pathBasename(fullpath) {
    let bname = ''
    if (fullpath) {
        bname = (fullpath.lastIndexOf('/') === fullpath.length - 1)
            ? ''
            : path.basename(fullpath)
    }
    return bname
}

function hasSuffix(path, suffixes) {
    for (let i in suffixes) {
        if (path.indexOf(suffixes[i], path.length - suffixes[i].length) !== -1) {
            return true
        }
    }
    return false
}

function serialize(graph, baseUri, contentType) {
    return new Promise((resolve, reject) => {
        try {
            // target, kb, base, contentType, callback
            $rdf.serialize(null, graph, baseUri, contentType, function (err, result) {
                if (err) {
                    return reject(err)
                }
                if (result === undefined) {
                    return reject(new Error('Error serializing the graph to ' +
                        contentType))
                }

                resolve(result)
            })
        } catch (err) {
            reject(err)
        }
    })
}

function translate(stream, baseUri, from, to) {
    return new Promise((resolve, reject) => {
        let data = ''
        stream
            .on('data', function (chunk) {
                data += chunk
            })
            .on('end', function () {
                const graph = $rdf.graph()
                $rdf.parse(data, graph, baseUri, from, function (err) {
                    if (err) return reject(err)
                    resolve(serialize(graph, baseUri, to))
                })
            })
    })
}


function streamToStore(stream, baseUri, from) {
    return new Promise((resolve, reject) => {
        let data = ''
        stream
            .on('data', function (chunk) {
                debug('chunk:')
                debug(chunk)
                data += chunk
            })
            .on('end', function () {
                debug('ended')
                const graph = $rdf.graph()
                $rdf.parse(data, graph, baseUri, from, function (err) {
                    if (err) return reject(err)
                    resolve(graph)
                })
            })
    })
}

// Turtle only
function streamToN3Store(stream) {
    return new Promise((resolve, reject) => {
        const store = new N3.Store()
        // N3 Store requires PREFIX instead of @prefix and space before dot at end of triple
        const quadStream = rdfParser.parse(stream, {contentType: 'text/turtle'})

        store.import(quadStream)
            /*
            .on('data', (quad) => {
                console.log(quad);
            })
             */
            .on('error',function(err){
                debug('Importing quadstream: '+err)
            })
            .on('end', () => {
                resolve(store)
            })
    })
}

function quadStreamToN3Store(stream, store) {
    return new Promise((resolve, reject) => {
        stream
            .on('data', (data) => {
                //debug(data)
                store.addQuad(data)
            })
            .on('end', function () {
                resolve(store)
            })

        /*
        store.import(stream)
            .on('end', () => {
                resolve(store)
            })

         */
    })
}

function N3StoreToString(store) {
    return new Promise((resolve, reject) => {
        const writer = new N3.Writer({format: 'text/turtle'})
        writer.addQuads(store.getQuads())

        writer.end((error, result) => resolve(result))
    })
}

function quadStreamToString(quadStream) {
    return new Promise((resolve, reject) => {
        const writer = new N3.Writer()
        quadStream
            .on('data', (data) => {
                writer.addQuad(data)
            })
            .on('end', function () {
                writer.end((error, result) => {
                    resolve(result)
                })
            })
    })
}


function stringToStream(string) {
    return from(function (size, next) {
        // if there's no more content
        // left in the string, close the stream.
        if (!string || string.length <= 0) {
            return next(null, null)
        }

        // Pull in a new chunk of text,
        // removing it from the string.
        const chunk = string.slice(0, size)
        string = string.slice(size)

        // Emit "chunk" from the stream.
        next(null, chunk)
    })
}

// Filter file contents with read policies, executes originfilters on userStore instead of taking intersection
async function oldFilterGraph(req, graph) {
    const user = req.session.userId
    const [userFilters, originFilters] = req.acl.getFilters(user, 'Read')
    const [userOk, originOk] = req.acl.hasFullAccess(user, 'Read')
    const t1 = performance.now()
    const queryEngine = newEngine()
    const t2 = performance.now()
    debug('creating engine: '+(t2 - t1) + 'ms')

// Execute the filters found in user authorisations
    let userStore
    if (userOk) {
        userStore = graph
    } else {
        userStore = await filter(userFilters, graph, queryEngine)
    }
    const t3 = performance.now()
    debug('executing user filters: '+(t3 - t2) + 'ms')

// Execute the filters found in origin authorisations
    let originStore
    if (originOk) {
        originStore = userStore
    } else {
        originStore = await filter(originFilters, userStore, queryEngine)
    }

    const t4 = performance.now()
    debug('executing origin filters: '+(t4 - t3) + 'ms')

// Serialize store
    let data = await N3StoreToString(originStore)
    const t5 = performance.now()
    debug('serializing filtered store: '+(t5 - t4) + 'ms')
    return data
}


// Filter file contents with read policies
async function filterGraph(req, graph) {
    const user = req.session.userId
    const [userFilters, originFilters] = req.acl.getFilters(user, 'Read')
    const [userOk, originOk] = req.acl.hasFullAccess(user, 'Read')
    const t1 = performance.now()
    const queryEngine = newEngine()
    const t2 = performance.now()
    debug('creating engine: '+(t2 - t1) + 'ms')

// Execute the filters found in user authorisations
    let userStore
    if (userOk) {
       // userStore = graph
    } else {
        userStore = await filter(userFilters, graph, queryEngine)
    }
    const t3 = performance.now()
    debug('executing user filters: '+(t3 - t2) + 'ms')

// Execute the filters found in origin authorisations
    let originStore
    if (originOk) {
        //originStore = graph
    } else {
        originStore = await filter(originFilters, graph, queryEngine)
    }
    const t4 = performance.now()
    debug('executing origin filters: '+(t4 - t3) + 'ms')

// Take intersection
    let data
    if(userOk){
        //tempStore = originStore
        data = await N3StoreToString(originStore)
    }else if(originOk){
        //tempStore = userStore
        data = await N3StoreToString(userStore)
    }else {
        data = await intersection(userStore, originStore)
    }
    const t5 = performance.now()
    debug('taking intersection and/or serializing: '+(t5-t4)+'ms')

    return data
}

async function intersection(userStore, originStore) {
    return new Promise((resolve, reject) => {
        const writer = new N3.Writer({format: 'text/turtle'})
        originStore.forEach(quad => {
            if (userStore.getQuads(quad.subject, quad.predicate, quad.object, quad.graph).length > 0) {
                writer.addQuad(quad)
            }
        })
        writer.end((error, result) => {
            resolve(result)
        })
    })
}

// Execute queries (filters) on graph and return combined result sets
async function filter(filters, graph, engine) {
    let store = new N3.Store()
    //let writer = new N3.StreamWriter({})
    //debug('GRAPH:')
    //graph.forEach(quad => debug(quad.subject.value +"  "+quad.predicate.value+"  "+quad.object.value))

    for (var i = 0; i < filters.length; i++) {
        let queryString = filters[i].toString()
        //console.log('executing query: '+queryString)
        const before = performance.now()
        const result = await engine.query(queryString,
            {sources: [{type: 'rdfjsSource', value: graph}]})
        const temp = performance.now()
       // debug('ADDING RESULT SET TO STORE:')
        store = await quadStreamToN3Store(result.quadStream, store)
       // console.log('filter: executing query: '+(temp - before )+ ' ms')
       // console.log('filter: transfer to store: '+(performance.now() - temp) +'ms')
    }
    return store
}




async function canAppendStream(req, stream) {
    let user = req.session.userId
    if (req.acl.hasRefinedAccess(user, 'Append')) {
        //debug('has refined append access')
        try {
            const t1 = performance.now()
            const store = await streamToN3Store(stream)
            const t2 = performance.now()
            const temp1 = t2 - t1
            debug('streamToStore: ' + temp1 + 'ms')

            const ok = await isAuthorized(req, 'Append', store)
            const t3 = performance.now()
            return ok
        } catch (err) {
            debug('error verifying access: ' + req.originalUrl + ' -- ' + err.message)
            throw error(err, 'Error checking access rights')
        }
    }
}

// Checks if user has required access to full store
async function isAuthorized(req, mode, store) {
    let user = req.session.userId
    let [userFilters, originFilters] = req.acl.getFilters(user, mode)
    let [userOk, originOk] = req.acl.hasFullAccess(user, mode)
    const t0 = performance.now()
    const queryEngine = newEngine()
    // Execute the filters found in user authorisations
    const t1 = performance.now()
    let tempStore
    if (userOk) {
        tempStore = store
    } else {
        tempStore = await filter(userFilters, store, queryEngine)
    }
    // Execute the filters found in origin authorisations
    const t2 = performance.now()
    let filteredStore
    if (originOk) {
        filteredStore = tempStore
    } else {
        filteredStore = await filter(originFilters, tempStore, queryEngine)
    }
    const t3 = performance.now()

    let postAllowed = true
    postAllowed = store.every(quad => {
        if (filteredStore.getQuads(quad.subject, quad.predicate, quad.object, quad.graph).length === 0) {
            //debug('quad not in filtered store: '+quad.subject.value+', '+ quad.predicate.value+', '+ quad.object.value)
            return false
        }
        return true
    })
    const t4 = performance.now()
    debug('creating engine: '+(t1-t0)+'ms')
    debug('filtering first store (user filters): '+(t2-t1)+'ms')
    debug('filtering temp store (origin filters): '+(t3-t2)+'ms')
    debug('comparing filtered store to original: '+(t4-t3)+'ms')

    return postAllowed
}

/**
 * Removes line endings from a given string. Used for WebID TLS Certificate
 * generation.
 *
 * @param obj {string}
 *
 * @return {string}
 */
function stripLineEndings(obj) {
    if (!obj) {
        return obj
    }

    return obj.replace(/(\r\n|\n|\r)/gm, '')
}

/**
 * Adds a route that serves a static file from another Node module
 */
function routeResolvedFile(router, path, file, appendFileName = true) {
    const fullPath = appendFileName ? path + file.match(/[^/]+$/) : path
    const fullFile = require.resolve(file)
    router.get(fullPath, (req, res) => res.sendFile(fullFile))
}

/**
 * Returns the number of bytes that the user owning the requested POD
 * may store or Infinity if no limit
 */

async function getQuota(root, serverUri) {
    const filename = path.join(root, 'settings/serverSide.ttl')
    var prefs
    try {
        prefs = await _asyncReadfile(filename)
    } catch (error) {
        debug('Setting no quota. While reading serverSide.ttl, got ' + error)
        return Infinity
    }
    var graph = $rdf.graph()
    const storageUri = serverUri + '/'
    try {
        $rdf.parse(prefs, graph, storageUri, 'text/turtle')
    } catch (error) {
        throw new Error('Failed to parse serverSide.ttl, got ' + error)
    }
    return Number(graph.anyValue($rdf.sym(storageUri), ns.solid('storageQuota'))) || Infinity
}

/**
 * Returns true of the user has already exceeded their quota, i.e. it
 * will check if new requests should be rejected, which means they
 * could PUT a large file and get away with it.
 */

async function overQuota(root, serverUri) {
    let quota = await getQuota(root, serverUri)
    if (quota === Infinity) {
        return false
    }
    // TODO: cache this value?
    var size = await actualSize(root)
    return (size > quota)
}

/**
 * Returns the number of bytes that is occupied by the actual files in
 * the file system. IMPORTANT NOTE: Since it traverses the directory
 * to find the actual file sizes, this does a costly operation, but
 * neglible for the small quotas we currently allow. If the quotas
 * grow bigger, this will significantly reduce write performance, and
 * so it needs to be rewritten.
 */

function actualSize(root) {
    return util.promisify(getSize)(root)
}

function _asyncReadfile(filename) {
    return util.promisify(fs.readFile)(filename, 'utf-8')
}

/**
 * Get the content type from a headers object
 * @param headers An Express or Fetch API headers object
 * @return {string} A content type string
 */
function getContentType(headers) {
    const headerValue = headers.get ? headers.get('content-type') : headers['content-type']

    // Default content type as stated by RFC 822
    if (!headerValue) {
        return 'text/plain'
    }

    // Remove charset suffix
    return headerValue.split(';')[0]
}


async function N3Store(path) {
    const body = await withLock(path, () => promisify(fs.readFile)(path, {encoding: 'utf8'}))
    return new Promise((resolve, reject) => {
        const store = new N3.Store()
        const parser = new N3.Parser()
        parser.parse(body, (error, quad, prefixes) => {
            if (quad) store.addQuad(quad)
            if (error) throw error
        })
        resolve(store)
    })
}
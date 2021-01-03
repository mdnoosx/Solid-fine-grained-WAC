const rdf = require('rdflib')
const debug = require('debug')('solid:ACL')
const debug2 = require('debug')('solid:refACL')
const performance = require('perf_hooks').performance

const ACL = rdf.Namespace('http://www.w3.org/ns/auth/acl#')
const TEST = rdf.Namespace('https://raw.githubusercontent.com/mdnoosx/refinedACL/main/refinedacl#')
const FOAF = rdf.Namespace('http://xmlns.com/foaf/0.1/')

async function accessRights(kb, resourceuri, agent, requiredMode, origin, userOk, originOk) {
    if (userOk && originOk) {
        console.log('access should have already been granted by allow()')
    }
    const resource = rdf.sym(resourceuri)
    const [{length: base}] = resourceuri.match(/^[^:]+:\/*[^/]+/)
    // Find policies applying to document
    let auths = kb.each(null, TEST('appliesTo'), resource, null);
    const t1 = performance.now()
    // Find inherited policies
    let directory
    debug2('includes stopinheritance to resource ?')
    debug2(kb.holds(null, TEST('stopInheritance'), resource, null))
    if (!kb.holds(null, TEST('stopInheritance'), resource, null)) {
        for (let i = lastSlash(resourceuri); i >= base; i = lastSlash(resourceuri, i - 1)) {
            directory = rdf.sym(resourceuri.substr(0, i + 1))
            // authorisations have already been added
            if (directory.value == resource.value) {
                continue
            }
            auths = auths.concat(kb.each(null, TEST('inherit'), directory));
            // stopInheritance -> directory doesn't inherit policies from higher acl's
            if (kb.holds(null, TEST('stopInheritance'), directory, null)) {
                break
            }
        }
    }
    const t2 = performance.now()
    //debug('finding authorisations: '+(t2 - t1 )+'ms')

    let userauths = []
    let originauths = []
    //let groupauths = []
    //debug2('auths found applying to resource:')
    auths.forEach(auth => {
        //debug(auth)
        let public = kb.holds(auth, ACL('agentClass'), FOAF('Agent'), null)
        if (!userOk) {
            if (agent) {
                if (kb.holds(auth, ACL('agentClass'), ACL('AuthenticatedAgent'), null) ||
                    kb.holds(auth, ACL('agent'), rdf.sym(agent), null)) {
                    userauths.push(auth)
                } /*else if (kb.holds(auth, ACL('agentGroup'), null, null)) {
                    // only necessary if authorisation not added already
                    groupauths.push(auth)
                }*/
            }
            if (public) {
                userauths.push(auth)
            }
        }
        if (!originOk) {
            if (public) {
                originauths.push(auth)
            } else if (kb.holds(auth, ACL('origin'), origin, null)){
                originauths.push(auth)
            }
        }
    })

    const t3 = performance.now()
   // debug('checking authorisations: '+(t3 - t2)+'ms')


    let userFilters = []
    // TODO: groups checken
    if (!userOk) {
        userauths.forEach(auth => {
            if (kb.holds(auth, ACL('mode'), requiredMode)) {
                userFilters.push((kb.each(auth, TEST('hasAccessQuery'), null)))
            }
            if (requiredMode.equals(ACL('Append')) && kb.holds(auth, ACL('mode'), ACL('Write'))) {
                userFilters.push((kb.each(auth, TEST('hasAccessQuery'), null)))
            }

        })
    }

// Todo: fetch owner webid doc's to check for trusted modes for origin
    let originFilters = []
    if (!originOk) {
        originauths.forEach(auth => {
            if (kb.holds(auth, ACL('mode'), requiredMode)) {
                originFilters.push((kb.each(auth, TEST('hasAccessQuery'), null)))
            }

            if (requiredMode.equals(ACL('Append')) && kb.holds(auth, ACL('mode'), ACL('Write'))) {
                originFilters.push((kb.each(auth, TEST('hasAccessQuery'), null)))
            }

        })
    }

    const t4 = performance.now()
   // debug('extracting filters from authorisations: '+(t4 - t3)+'ms')


    debug2('userfilters: '+userFilters.length+', userok: '+userOk)
    userFilters.forEach(f => debug(f.toString()))
    debug2('originfilters: '+originFilters.length+', originok: ' +originOk)
    //originFilters.forEach(f => debug(f.toString()))





    return Promise.resolve([userFilters, originFilters])
}


// Returns the index of the last slash before the given position
function lastSlash(string, pos = string.length) {
    return string.lastIndexOf('/', pos)
}

module.exports.accessRights = accessRights
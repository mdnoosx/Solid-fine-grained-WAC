var site_location = 'https://alice.localhost:8443/public/annotations/';
var local_location = '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/'

const debug = require('debug')('solid:ACL')
const solid = require('solid-auth-client');
//const FileClient = require('solid-file-client')
//const fc         = new FileClient(solid)
const rdf = require('rdflib');
//const ns = require('rdf-ns')(rdf);
const uuidv1 = require('uuid/v1');
var fs = require('fs');
const randomUserOriginal = require('random-user');
const $rdf = require('rdflib');
const promiseRetry = require('promise-retry');

const OA = rdf.Namespace('http://www.w3.org/ns/oa#');
const RDF = rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const RDFS = rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
const DCT = rdf.Namespace('http://purl.org/dc/terms/');
const EX = rdf.Namespace('http://example.com/');
var XSD = rdf.Namespace("http://www.w3.org/2001/XMLSchema#");

const web_workers = 10; // Cannot create all annotations at the same time, so divide work.
                        // TODO http://doduck.com/concurrent-requests-node-js/

const number_of_users = 10;
const number_of_websites = 10;
/*
const directory_levels = 3; // = 0 => save_location is only folder
const directory_children = 2;
const annotations_per_file = 1;
const files_per_folder = 2;
const number_of_annotations = Math.pow(directory_children, directory_levels)*files_per_folder*annotations_per_file;z
 */
const number_of_annotations = 2;

const fragments = ["introduction", "chapter_one", "chapter_two", "listing_one",
    "listing_two", "listing_three", "conclusion", "sources", "comments", "about"];

let users = [];
let websites = [];
let annotations = [];


// Adapted function to only return names that match regex /^[A-Za-z]+$/
function randomUser() {
    return promiseRetry(function (retry, number) {
        //console.log('attempt number', number);
        return new Promise(function (resolve, reject) {
            randomUserOriginal('simple')
                .then((data) => {
                    if (/^[A-Za-z]+$/.test(data.firstName) && /^[A-Za-z]+$/.test(data.lastName)) {
                        resolve(data);
                        //console.log('DATA: '+data.firstName + ', '+data.lastName)
                    } else {
                        //console.log("REJECTED: " + data.firstName + " " + data.lastName);
                        reject(data);
                    }
                }).catch((err) => {
                console.log('error creating random user: ' + err);
                reject(err);
            });
        }).catch(retry);
    });
}

// Generate a list of random users (and create specific bin for each user)
function generate_users() {
    return new Promise(function (resolve, reject) {
        for (let i = 0; i < number_of_users; i++) {
            let user = null;
            randomUser()
                .then((data) => {
                    user = data;
                    const username = user.username;
                    // console.log('user.directory at '+save_location+ username+'/')
                    //user.directory = save_location+ username+'/'
                    user.directory = site_location + username + '/'
                    users.push(user);
                    if (users.length == number_of_users) resolve();
                })
                .catch((err) => {
                    console.log('error generating user: ' + err);
                    reject(err);
                });
        }
    });
}

// Generate a list of random websites, and multiple fragments per website
function generate_websites() {
    return new Promise(function (resolve, reject) {
        for (let i = 0; i < number_of_websites; i++) {
            let website = null;
            randomUser()
                .then((data) => {

                    website = 'https://www.' + data.firstName + data.lastName + '.com';
                    websites.push(website);
                    if (websites.length == number_of_websites) resolve();
                })
                .catch((err) => {
                    console.log('error generating websites: ' + err);
                    reject(err);
                });
        }
    });
}


// Generate annotation for randomly chosen user on a randomly chosen website + fragment
// Generates random title, text, date
async function generate_annotations(number_of_annotations, users, websites, fragments) {
    return new Promise(function (resolve, reject) {

        let save_location = site_location;
        var graph = rdf.graph(); // create an empty graph
        for (let i = 0; i < number_of_annotations; i++) {
            let user_id = Math.floor(Math.random() * users.length);
            let website_id = Math.floor(Math.random() * websites.length);
            let fragment_id = Math.floor(Math.random() * fragments.length);

            let user = users[user_id];
            let website = websites[website_id];
            let fragment = fragments[fragment_id];

            //console.log('trying to create annotation')

            console.log('user.directory: ' + user.directory)
            let annotation = {
                source: rdf.sym(website),
                //target: rdf.sym(website + '#' + fragment),
                target: rdf.sym(save_location + '#annotation' + i.toString() + "_target"),
                author: rdf.sym(user.directory + 'card#me'),  // This does not actually exist
                title: rdf.lit(user.firstName + " " + user.lastName + " created an annotation", 'en'),
                date: rdf.lit(new Date().toUTCString()), // TODO
                exact: rdf.lit('text to highlight', 'en'), // TODO
                prefix: rdf.lit('text before highlighted text', 'en'),
                suffix: rdf.lit('text after highlighted text', 'en'),
                comment_text: rdf.lit('Comment text goes here', 'en'),
                comment_text_nl: rdf.lit('De commentaar komt hier', 'nl')
            }

            console.log('author:' + annotation.author)
            // console.log('\nannotation:')
            // console.log(annotation)


            var thisResource = rdf.sym(save_location + '#annotation' + i.toString());
            var selector = rdf.sym(save_location + '#annotation' + i.toString() + "_selector");

            // Uses WebAnnotations recommended ontologies
            graph.add(thisResource, RDF('type'), OA('Annotation'));
            graph.add(thisResource, OA('hasTarget'), annotation.target);
            graph.add(thisResource, DCT('creator'), annotation.author);
            graph.add(thisResource, DCT('created'), annotation.date);
            graph.add(thisResource, RDFS('label'), annotation.title);
            // graph.add(thisResource, OA('motivatedBy'), OA('commenting')); //https://www.w3.org/TR/annotation-vocab/#named-individuals

            var body = rdf.sym(thisResource.uri + '_body');
            graph.add(thisResource, OA('hasBody'), body);
            graph.add(body, RDF('type'), OA('TextualBody'));
            graph.add(body, RDF('value'), annotation.comment_text);
            graph.add(body, RDF('value'), annotation.comment_text_nl);

            //graph.add(annotation.target, RDF('type'), OA('SpecificResource'));
            graph.add(annotation.target, OA('hasSelector'), selector);
            graph.add(annotation.target, OA('hasSource'), annotation.source);

            graph.add(selector, RDF('type'), OA('TextQuoteSelector'));
            graph.add(selector, OA('exact'), annotation.exact);
            graph.add(selector, OA('prefix'), annotation.prefix);
            graph.add(selector, OA('suffix'), annotation.suffix);

            /*
            var text_quote_selector = rdf.sym(thisResource.uri + '#text-quote-selector'+i.toString());

            graph.add(selector, RDF('type'), OA('FragmentSelector'));
            graph.add(selector, OA('refinedBy'), text_quote_selector);

            graph.add(text_quote_selector, RDF('type'), OA('TextQuoteSelector'));
            graph.add(text_quote_selector, OA('exact'), annotation.exact);
            graph.add(text_quote_selector, OA('prefix'), annotation.prefix);
            graph.add(text_quote_selector, OA('suffix'), annotation.suffix);
             */
        }

        //var data = new rdf.Serializer(graph).toN3(graph); // create Notation3 serialization
        var data = $rdf.serialize(undefined, graph, save_location, 'text/turtle')

        //const url = local_location+slug;
        /* fs.writeFile(url, data,function(err) {
           if(err) {
             console.log(err);
             reject(err);
           }
         })
         annotations.push(url);
         */
        const url = local_location + number_of_annotations.toString() + 'annotations.ttl';
        fs.appendFile(url, data + "\n\n", function (err, result) {
            if (err) console.log('error', err);
        })
        if (annotations.length == number_of_annotations) {
            resolve();
        }
    });
}

// Generate annotation for randomly chosen user on a randomly chosen website + fragment
// Generates random title, text, date
async function generate_short_annotations(number_of_annotations, users, websites, fragments) {
    return new Promise(function (resolve, reject) {

        let save_location = site_location;
        var graph = rdf.graph(); // create an empty graph
        for (let i = 0; i < number_of_annotations; i++) {
            let user_id = Math.floor(Math.random() * users.length);
            let website_id = Math.floor(Math.random() * websites.length);
            let fragment_id = Math.floor(Math.random() * fragments.length);
            let prior = Math.floor((Math.random() * 10) + 1)
            var hide = 'false';
            if (Math.random() > 0.9) {
                hide = 'true';
            }

            let user = users[user_id];
            let website = websites[website_id];
            let fragment = fragments[fragment_id];
            //console.log('trying to create annotation')

            console.log('user.directory: ' + user.directory)
            let annotation = {
                //target: rdf.sym(website + '#' + fragment),
                photo: rdf.sym(website + '/photo' + ".png"),
                author: rdf.sym(user.directory + 'card#me'),  // This does not actually exist
                title: rdf.lit(user.firstName + " " + user.lastName + " created an annotation", 'en'),
                date: rdf.lit(new Date().toUTCString()),
                comment_text: rdf.lit('Comment text goes here', 'en'),
                comment_text_nl: rdf.lit('De commentaar komt hier', 'nl'),
                priority: rdf.lit(prior.toString(), undefined, XSD('int')),
                hidden: rdf.lit(hide)
            }
            var thisResource = rdf.sym(save_location + '#annotation' + i.toString());

            console.log('annotation hidden: ' + annotation.hidden)

            graph.add(thisResource, RDF('type'), OA('Annotation'));
            graph.add(thisResource, OA('motivatedBy'), OA('commenting'));
            graph.add(thisResource, EX('priority'), annotation.priority);
            graph.add(thisResource, EX('isHidden'), annotation.hidden)
            graph.add(thisResource, OA('hasTarget'), annotation.photo);
            graph.add(thisResource, DCT('creator'), annotation.author);
            graph.add(thisResource, DCT('created'), annotation.date);
            graph.add(thisResource, RDFS('label'), annotation.title);
            graph.add(thisResource, OA('hasBody'), annotation.comment_text);
            graph.add(thisResource, OA('hasBody'), annotation.comment_text_nl);
        }
            var data = $rdf.serialize(undefined, graph, save_location, 'text/turtle')
            const url = local_location + number_of_annotations.toString() + 'short_annotations.ttl';
            fs.writeFile(url, data + "\n\n", function (err, result) {
                if (err) console.log('error', err);
            })
            if (annotations.length == number_of_annotations) {
                resolve();
            }

    })
}

// Call functions to generate users, websites and annotations
    generate_users().then(function () {
        console.log("Users created");
        return generate_websites();
    }).then(function () {
        console.log("Websites created");
        //return generate_annotations(number_of_annotations, users, websites, fragments);
        return generate_short_annotations(number_of_annotations, users, websites, fragments);
    }).then(function () {
        console.log("Annotations created");
    }).catch(function (err) {
        console.log(err);
    });

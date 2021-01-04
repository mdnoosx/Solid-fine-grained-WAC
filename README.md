# Solid-fine-grained-WAC

This an extension to the Solid server from https://github.com/solid/node-solid-server
to be able to create fine-grained access control policies.

Some notes on the use:

Only fine-grained access control (FGAC) support exists for files in Turtle representation.
No FGAC support for HTTP COPY is implemented.
Groups and trusted origin definitions in the owner profile are not supported as well.

The RDFLib library was adapted in order to support fine-grained access for HTTP PATCH (only in the format 
’application/sparql-update’). This requires running 'npm run prepublishOnly' once.

N3 store is used for executing the access queries. This requires 'PREFIX' be used instead of 
'@prefic' and a space is required before the dot at end of triple.

For HTTP POST, there is a problem loading the data from the request stream in the N3 store 
when files contain more than 2000 triples. 

(run 'bin/solid-test start' to start server)

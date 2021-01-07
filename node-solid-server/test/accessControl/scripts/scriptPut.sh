#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'



for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @2annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol2ann.json'

for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @5annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol5ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @10annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 10 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol10ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @20annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 20 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol20ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @50annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 50 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol50ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X PUT -d @100annotations.ttl https://alice.localhost:8443/public/annotations/puttest.ttl
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/puttest.ttl'
echo \n 100 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PutTimesOrigin2pol100ann.json'





printf \\a

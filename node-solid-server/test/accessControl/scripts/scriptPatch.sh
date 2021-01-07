#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/2short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/2short_annotations.ttl
sleep 1;

echo \n 2 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes2ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/5short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/5short_annotations.ttl
sleep 1;

echo \n 5 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes5ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/10short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/10short_annotations.ttl
sleep 1;

echo \n 10 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes10ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/20short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/20short_annotations.ttl
sleep 1;

echo \n 20 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes20ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/50short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/50short_annotations.ttl
sleep 1;

echo \n 50 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes50ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/100short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/100short_annotations.ttl
sleep 1;

echo \n 100 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes100ann.json'




for i in {1..100};
do
curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @doPatch.ttl https://alice.localhost:8443/public/annotations/200short_annotations.ttl
sleep 1

curl -k -H "Content-Type: application/sparql-update"  -X PATCH -d @undoPatch.ttl https://alice.localhost:8443/public/annotations/200short_annotations.ttl
sleep 1;

echo \n 200 ${i};
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PatchTimes200ann.json'





printf \\a

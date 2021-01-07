#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @2annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/

echo \n 1 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol2ann.json'

for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @5annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/

echo \n 5 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol5ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @10annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/

echo \n 10 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol10ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @20annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/

echo \n 20 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol20ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @50annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/

echo \n 50 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol50ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @100annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/


echo \n 100 ${i};
sleep 2;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/noPostTimes2pol100ann.json'





printf \\a

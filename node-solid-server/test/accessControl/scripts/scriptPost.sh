#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'



for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @2annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol2ann.json'

for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @5annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol5ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @10annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 10 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol10ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @20annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 20 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol20ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @50annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 50 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol50ann.json'


for i in {1..200};
do
curl -k -H "Content-Type: text/turtle"  -X POST  -d @100annotations.ttl --header "Slug:testpost.ttl" https://alice.localhost:8443/public/annotations/
rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/testpost.ttl'
echo \n 100 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/PostTimesOrigin2pol100ann.json'





printf \\a

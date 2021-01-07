#!/bin/bash

echo 'starting'


rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'



for i in {1..200};
do

cp 2annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/2annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete2ann.json'





for i in {1..200};
do

cp 5annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/5annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete5ann.json'

for i in {1..200};
do

cp 10annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/10annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete10ann.json'

for i in {1..200};
do

cp 20annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/20annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete20ann.json'
for i in {1..200};
do

cp 50annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/50annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete50ann.json'

for i in {1..200};
do

cp 100annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/100annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete100ann.json'

for i in {1..200};
do

cp 200annotations.ttl /Users/mariedenoo/Desktop/Thesis/code/node-solid-server/data/alice.localhost/public/annotations/

curl -k -X DELETE https://alice.localhost:8443/public/annotations/200annotations.ttl

echo \n 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/Delete200ann.json'


printf \\a

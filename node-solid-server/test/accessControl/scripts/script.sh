#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/2short_annotations.ttl
echo 2 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times2BSBMandann.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/5short_annotations.ttl
echo 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times5BSBMandann.json'



for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/10short_annotations.ttl
echo 10 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times10BSBMandann.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/20short_annotations.ttl
echo 20 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times20BSBMandann.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/50short_annotations.ttl
echo 50 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times50BSBMandann.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/100short_annotations.ttl
echo 100 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times100BSBMandann.json'



for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/200short_annotations.ttl
echo 200 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times200BSBMandann.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/500short_annotations.ttl
echo 200 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times500BSBMandann.json'



printf \\a

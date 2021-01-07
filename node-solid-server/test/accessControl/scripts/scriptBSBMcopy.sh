#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/5short_annotations.ttl
echo 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times5BSBMandann.json'



for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/500short_annotations.ttl
echo 500 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times500BSBMandann.json'



printf \\a

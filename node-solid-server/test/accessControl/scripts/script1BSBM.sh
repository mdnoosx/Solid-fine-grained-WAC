#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'



for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale1.ttl
echo 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ7scale1.json'


printf \\a

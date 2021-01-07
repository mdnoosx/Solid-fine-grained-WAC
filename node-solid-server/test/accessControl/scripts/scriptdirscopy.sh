#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

for i in {1..200};
do curl -k https://alice.localhost:8443/public/5short_annotations.ttl
echo 4 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times3acls.json'

for i in {1..200};
do curl -k https://alice.localhost:8443/5short_annotations.ttl
echo 2 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times2acls.json'

printf \\a

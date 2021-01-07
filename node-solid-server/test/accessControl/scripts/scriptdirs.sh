#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'

for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/directory1/directory2/directory3/directory4/directory5/5short_annotations.ttl
echo 9 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times9acls.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/directory1/directory2/directory3/directory4/5short_annotations.ttl
echo 8 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times8acls.json'

for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/directory1/directory2/directory3/5short_annotations.ttl
echo 7 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times7acls.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/directory1/directory2/5short_annotations.ttl
echo 6 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times6acls.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/directory1/5short_annotations.ttl
echo 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times5acls.json'


for i in {1..200};
do curl -k https://alice.localhost:8443/public/annotations/5short_annotations.ttl
echo 4 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times4acls.json'

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

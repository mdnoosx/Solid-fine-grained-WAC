#!/bin/bash

echo 'starting'

rm '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json'



for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale1.ttl
echo 1 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale1.json'





for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale2.ttl
echo 2 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale2.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale3.ttl
echo 3 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale3.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale4.ttl
echo 4 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale4.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale5.ttl
echo 5 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale5.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale6.ttl
echo 6 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale6.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale7.ttl
echo 7 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale7.json'




for i in {1..200};
do curl -k https://alice.localhost:8443/public/BSBM/scale8.ttl
echo 8 ${i};
sleep 1;
done

mv -i '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/times.json' '/Users/mariedenoo/Desktop/Thesis/code/node-solid-server/times/timesQ12scale8.json'



printf \\a

module.exports = time

const fs = require('fs')
const performance = require('perf_hooks').performance
var util = require('util')

function time (count) {
    return async function handler(req, res, next) {
        if(!req.mytime ){
            req.mytime = performance.now()
            req.times = {}
            req.times.acInHandler = 0
            req.times.headerpermissions = 0
            req.times.handlerTimes = []
            return next()
        }
        const newTime = performance.now()
        const elapsed = newTime - req.mytime
        if(count == 'header'){
            req.times.headerpermissions = elapsed
        }else {
            req.times.handlerTimes.push(elapsed)
        }
        console.log('TIME '+count+': '+elapsed + 'ms elapsed')
        if(count == 3){
            await fs.appendFile('./times/times.json', JSON.stringify(req.times, null, 2)+"\n ;",function(err, result) {
            if(err) console.log('error', err);
            });
            console.log('\n\n')
        }
        req.mytime = newTime
        return next()
    }
}
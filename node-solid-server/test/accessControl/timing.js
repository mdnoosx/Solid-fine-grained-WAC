const fs = require('fs')
const math = require('mathjs')

const burnAfterReading = false
const disregardOutliers = true
const averageOfaverage = false

function analyseFile(path) {
    let times = []
    console.log("FILE: "+path)
    fs.readFileSync(path).toString().split(';').forEach(function (line) {
        if (line != "") {
            times.push(JSON.parse(line))
        }
    })

    if (burnAfterReading) {
        fs.writeFileSync(path, "", function (err, result) {
            if (err) console.log('error', err);
        });
    }

// Average time spent in each handler
    let h1 = []
    let h2 = []
    let h3 = []
    let headerpermissions = []
    let total = []
    times.forEach(t => {
        h1.push(t.handlerTimes[0])
        h2.push(t.handlerTimes[1])
        h3.push(t.handlerTimes[2])
        headerpermissions.push(t.headerpermissions)
        total.push((t.handlerTimes[0] + t.handlerTimes[1] + t.handlerTimes[2]+t.headerpermissions))
      //  total.push((t.handlerTimes[0] + t.handlerTimes[1] + t.handlerTimes[2]))
    })

    let h1avg = average(h1)
    let h2avg = average(h2)
    let h3avg = average(h3)
    let totavg = average(total)
    let headeravg = average(headerpermissions)

    const median = arr => {
        const mid = Math.floor(arr.length / 2),
            nums = [...arr].sort((a, b) => a - b);
        return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };


// Overhead of refined access control
    let original = [] // original time to handle request
    let refined = [] // additional FGAC (fine-grained access control) time
    let nonAC // time in HTTP handler spent on other things than access control (filtering data etc)
    let AC // time in HTTP handler spent on access control (filtering data etc)
    let handlerNonAC = []
    let handlerAC = []
    let overheadarr = []
    let ref,org
        times.forEach(t => {
        AC = t.acInHandler
        handlerAC.push(AC)
        ref = t.handlerTimes[1] + AC
        refined.push(ref)
        nonAC = t.handlerTimes[2] - AC
        handlerNonAC.push(nonAC)
        org = t.handlerTimes[0] + nonAC + t.headerpermissions
        //org = t.handlerTimes[0] + nonAC
        original.push(org)
        overheadarr.push(ref/org)
    })

    let originalavg = average(original)
    let refinedavg = average(refined)
    let originalmed = median(original)
    let refinedmed = median(refined)
    let originalvar = Math.pow(math.std(original), 2)
    let refinedvar = Math.pow(math.std(refined), 2)
    let overheadavg = average(overheadarr)


    console.log("Total response time: "+totavg)
    console.log("Average for allow: " + h1avg + ", allow-refined: " + h2avg+", handler:"+ h3avg)
   // console.log("Average for adding headerpermissions: "+headeravg)
    console.log("Median for allow: " + median(h1) + ", allow-refined: " + median(h2))
    console.log("Handler med: "+median(h3)+", handler AC: "+median(handlerAC)+", handler without AC: "+median(handlerNonAC))
    console.log("FGAC TOTAL AVG: " + refinedavg+", original response time: " + originalavg )
  //  console.log("FGAC TOTAL med: " + refinedmed+", orginal response time: " + originalmed )
    //console.log("Original avg time required to handle request: " + originalavg + ", var: " + originalvar + ", additional time required: " + refinedavg + ", var: " + refinedvar)
    //console.log("Original med time required to handle request: " + originalmed + ", additional med time required: " + refinedmed)
    console.log("fgac avg overhead: " + overheadavg)


// Time taken by parsing acl files
    let parsing = []
    let refinedWithoutParsing = []
    let refinedWithoutParsingAndFindingFilters = []
    let refinedWithoutFinding = []
    times.forEach(t => {
        parsing.push(t.parsingACLs)
        let ref = t.handlerTimes[1] + t.acInHandler
        refinedWithoutParsing.push(ref - t.parsingACLs)
        refinedWithoutParsingAndFindingFilters.push(ref - t.parsingACLs - t.findingFilters)
        refinedWithoutFinding.push(ref - t.findingFilters)
    })

//let avg = average(parsing)
//console.log('average parsing time: '+avg)

// todo: check if math.std is correct ('uncorrected', 'unbiased',...)
    let varRefinedAC = Math.pow(math.std(refined), 2)
    let varRefinedACNoParsing = Math.pow(math.std(refinedWithoutParsing), 2)
    let varRefinedNoParsingNoFinding = Math.pow(math.std(refinedWithoutParsingAndFindingFilters), 2)
    let varRefinedNoFinding = Math.pow(math.std(refinedWithoutFinding), 2)

//console.log('refinedwithoutparsing: '+refinedWithoutParsing)
//console.log("variance in additional AC time: "+varRefinedAC+", variance without fetching and parsing acls included: "+varRefinedACNoParsing+",\n" +
//    " variance without finding filters and fetching and parsing: "+varRefinedNoParsingNoFinding+", variance without finding filters included: "+varRefinedNoFinding)

    if (averageOfaverage) {
        const aoah1 = averageOfaverages(h1)
        const aoah2 = averageOfaverages(h2)
        const aoah3 = averageOfaverages(h3)
        const aoaOrgCode = averageOfaverages(original)
        const aoaRefAC = averageOfaverages(refined)
        console.log("Average of 5 averages of allow: " + aoah1 + ", of allow-refined: " + aoah2 + ", of handler: " + aoah3)
        console.log("Average of 5 averages of original code: " + aoaOrgCode + ", of refined AC: " + aoaRefAC)
    }
}

function averageOfaverages(array){
    const length = array.length
    const part = Math.floor(length / 5)
    const avg1 = average(array.slice(0, part))
    const avg2 = average(array.slice(part, 2*part))
    const avg3 = average(array.slice(2*part, 3*part))
    const avg4 = average(array.slice(3*part, 4*part))
    const avg5 = average(array.slice(4*part, 5*part))
  //  console.log('averages: '+avg1+", "+avg2+", "+avg3+", "+avg4+", "+avg5)
    return average([avg1, avg2, avg3, avg4, avg5], true)
}

function average(array, aoa = false){
    let total = array.reduce((a, b) => a + b, 0)
    let avg
    if(disregardOutliers && (!aoa)){
        avg = (total - Math.min(...array) - Math.max(...array)) / (array.length - 2)
    }else {
        avg = total / array.length
    }
    return avg
}

function sum(array){
    return array.reduce((a, b) => a + b, 0)
}

function mean(array) {
    return sum(array) / array.length;
}

// GET
/*
analyseFile('../../times/htimesH2ann.json')
analyseFile('../../times/htimesH5ann.json')
analyseFile('../../times/htimesH10ann.json')
analyseFile('../../times/htimesH20ann.json')
analyseFile('../../times/htimesH50ann.json')
analyseFile('../../times/htimesH100ann.json')
analyseFile('../../times/htimesH200ann.json')
analyseFile('../../times/htimesH500ann.json')

 */





/*
analyseFile('../../times/times1pol5ann.json')
analyseFile('../../times/times1pol10ann.json')
analyseFile('../../times/times1pol20ann.json')
analyseFile('../../times/times1pol50ann.json')
analyseFile('../../times/times1pol100ann.json')
analyseFile('../../times/times1pol200ann.json')
analyseFile('../../times/times1pol500ann.json')
 */




/* POST
analyseFile('../../times/PostTimesOrigin2pol2ann.json')
analyseFile('../../times/PostTimesOrigin2pol5ann.json')
analyseFile('../../times/PostTimesOrigin2pol10ann.json')
analyseFile('../../times/PostTimesOrigin2pol20ann.json')
analyseFile('../../times/PostTimesOrigin2pol50ann.json')
analyseFile('../../times/PostTimesOrigin2pol100ann.json')

 */
//analyseFile('../../times/timesOrigin2pol200ann.json')




// POST
/*
analyseFile('../../times/PostTimes2pol2ann.json')
analyseFile('../../times/PostTimes2pol5ann.json')
analyseFile('../../times/PostTimes2pol10ann.json')
analyseFile('../../times/PostTimes2pol20ann.json')
analyseFile('../../times/PostTimes2pol50ann.json')
analyseFile('../../times/PostTimes2pol100ann.json')
 */



/*
analyseFile('../../times/noPostTimes2pol2ann.json')
analyseFile('../../times/noPostTimes2pol5ann.json')
analyseFile('../../times/noPostTimes2pol10ann.json')
analyseFile('../../times/noPostTimes2pol20ann.json')
analyseFile('../../times/noPostTimes2pol50ann.json')
analyseFile('../../times/noPostTimes2pol100ann.json')

 */



// PUT
/*
analyseFile('../../times/PutTimesOverwrite2ann.json')
analyseFile('../../times/PutTimesOverwrite5ann.json')
analyseFile('../../times/PutTimesOverwrite10ann.json')
analyseFile('../../times/PutTimesOverwrite20ann.json')
analyseFile('../../times/PutTimesOverwrite50ann.json')
analyseFile('../../times/PutTimesOverwrite100ann.json')

 */



// DELETE
/*
analyseFile('../../times/Delete2ann.json')
analyseFile('../../times/Delete5ann.json')
analyseFile('../../times/Delete10ann.json')
analyseFile('../../times/Delete20ann.json')
analyseFile('../../times/Delete50ann.json')
analyseFile('../../times/Delete100ann.json')
 */

// PATCH
/*
analyseFile('../../times/PatchTimes2ann.json')
analyseFile('../../times/PatchTimes5ann.json')
analyseFile('../../times/PatchTimes10ann.json')
analyseFile('../../times/PatchTimes20ann.json')
analyseFile('../../times/PatchTimes50ann.json')
analyseFile('../../times/PatchTimes100ann.json')
analyseFile('../../times/PatchTimes200ann.json')
 */


//ACLS
/*
analyseFile('../../times/times2acls.json')
analyseFile('../../times/times3acls.json')
analyseFile('../../times/times4acls.json')
analyseFile('../../times/times5acls.json')
analyseFile('../../times/times6acls.json')
analyseFile('../../times/times7acls.json')
analyseFile('../../times/times8acls.json')
analyseFile('../../times/times9acls.json')

 */


//BSBM
//analyseFile('../../times/timesQ7scale1.json')
/*
analyseFile('../../times/timesQ8scale20.json')
analyseFile('../../times/timesQ8scale50.json')
analyseFile('../../times/timesQ8scale100.json')
analyseFile('../../times/timesQ8scale4.json')
analyseFile('../../times/timesQ8scale5.json')
analyseFile('../../times/timesQ8scale6.json')
analyseFile('../../times/timesQ8scale7.json')
analyseFile('../../times/timesQ8scale8.json')

 */
analyseFile('../../times/times2BSBMandann.json')
analyseFile('../../times/times5BSBMandann.json')
analyseFile('../../times/times10BSBMandann.json')
analyseFile('../../times/times20BSBMandann.json')
analyseFile('../../times/times50BSBMandann.json')
analyseFile('../../times/times100BSBMandann.json')
analyseFile('../../times/times200BSBMandann.json')
//analyseFile('../../times/times10BSBMandann.json')




const fs = require('fs')

const { readJson, writeJson } = require('../utils/rwjson')

let files = readJson('resources/conf/versionedfiles.json')

let versioninfo = {}

for(let file of files){
    let stat = fs.statSync(file)
    versioninfo[file] = stat
}

writeJson('resources/conf/versioninfo.json', versioninfo)

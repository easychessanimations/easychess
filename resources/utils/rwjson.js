const fs = require('fs')

function readJson(path, def){
    try{
        let content = fs.readFileSync(path).toString()        
        let obj = JSON.parse(content)
        return obj
    }catch(err){
        console.log(err)
        return def
    }
}

function writeJson(path, obj){
    try{
        let json = JSON.stringify(obj, null, 2)
        fs.writeFileSync(path, json)
        return true
    }catch(err){
        console.log(err)
        return false
    }
}

module.exports.readJson = readJson
module.exports.writeJson = writeJson

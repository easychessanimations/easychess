const fs = require('fs')

function getFiles(path){
    let entries = fs.readdirSync(path, {withFileTypes: true})    
    return entries.filter(entry=>entry.isFile()).map(entry=>entry.name)
}

module.exports.getFiles = getFiles

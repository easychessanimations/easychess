const fs = require('fs')

const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.EASYCHESS_HEROKU_TOKEN })

const CHUNK_SIZE = 1000

function tochunks(str, accOpt){
    let acc = accOpt || []
    if(!str.length) return acc
    if(str.length <= CHUNK_SIZE){
        acc.push(str)
        return acc
    }
    acc.push(str.substring(0, CHUNK_SIZE))
    return tochunks(str.substring(CHUNK_SIZE), acc)
}

function fromchunks(path){
    let i = 0
    let acc = ""
    let ok = true
    do{
        if(process.env[`SACCKEY${i}`]){
            acc += process.env[`SACCKEY${i++}`]
        }else{
            ok = false
        }
    }while(ok)
    let sacckey = Buffer.from(acc, "base64").toString()
    fs.writeFileSync(path || './firebase/sacckey.json', sacckey)
}

function createenv(){
    let sacckeyorig = fs.readFileSync('./firebase/sacckeyorig.json').toString()
    let sacckeyorig_b64 = new Buffer.from(sacckeyorig, "utf-8").toString("base64")    
    let chunks = tochunks(sacckeyorig_b64)
    let i = 0    
    fs.writeFileSync('./firebase/makeenv.bat', chunks.map(chunk=>`set SACCKEY${i++}=${chunk}`).join("\n"))
    i = 0
    let body = {}
    chunks.forEach(chunk=>body[`SACCKEY${i++}`] = chunk)
    heroku.patch('/apps/easychess/config-vars', {body: body}).then((cv)=>{            
        console.log("heroku response", cv)
    })
}

if(require.main == module){
    const command = process.argv[2]

    switch(command){
        case "createenv":
            createenv()
            break
        case "fromchunks":
            fromchunks()
            break
    }    
}else{
    module.exports.fromchunks = fromchunks
}

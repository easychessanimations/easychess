const fetch = require('node-fetch')

const P = p => new Promise(p)

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 31 * DAY
const YEAR = 366 * DAY

function GET_PROPS(){    
    if(typeof PROPS != "undefined"){
        return PROPS
    }
    return ({})
}

function GET_USER(){        
    let user = GET_PROPS().USER
    if(typeof user != "undefined"){
        return user
    }
    return ({})
}

const RP = value => P(resolve => {
    resolve(value)
})

class OrderedHash_{
    constructor(blob){
        this.fromBlob(blob)
    }

    fromBlob(blobOpt){        
        this.blob = blobOpt || []
        return this
    }

    getKey(key){
        return this.blob.find(entry => entry[0] == key)
    }

    get(key){
        let entry = this.getKey(key)
        if(entry) return entry[1]
        return null
    }

    setKey(key, value){
        let entry = this.getKey(key)

        if(entry){
            entry[1] = value
            return
        }

        this.blob.push([key, value])
    }
}
function OrderedHash(blobOpt){return new OrderedHash_(blobOpt)}

Array.prototype.splitFilter =
    function(filterFunc){return [this.filter(filterFunc), this.filter(x => !filterFunc(x))]}

function logRemote(msg){
    if(typeof PROPS == "undefined") return
    let lru = PROPS.LOG_REMOTE_URL
    if(!lru) return
    if(PROPS.LOG_REMOTE) fetch(`${lru}${msg}`)
}

function readFile(file, method){
    return P(resolve=>{
        let reader = new FileReader()

        reader.onload = event => {          
            resolve(event)
        }

        reader[method](file)                
    })
}

let markdownconverter = null

try{
    markdownconverter = new showdown.Converter()
}catch(err){}

function IS_DEV(){
    if(typeof PROPS.IS_DEV != "undefined") return PROPS.IS_DEV
    return !!document.location.host.match(/localhost/)
}

Array.prototype.itoj = function(i, j){    
    while(i != j){
        const n = j > i ? i + 1 : i - 1;
        [ this[i], this[n] ] = [ this[n], this[i] ]
        i = n
    }
}

function UID(){
    return "uid_" + Math.random().toString(36).substring(2,12)
}

function cloneObject(obj){
    return JSON.parse(JSON.stringify(obj))
}

function simpleFetch(url, params, callback){
    params.headers = params.headers || {}
    if(params.asForm) params.headers["Content-Type"] = "application/x-www-form-urlencoded"
    if(params.asJson) params.headers.Accept = "application/json"    
    if(params.asVndLichessV3Json){
        params.headers.Accept = "application/vnd.lichess.v3+json"
        params.asJson = true
    }
    if(params.asNdjson) params.headers.Accept = "application/x-ndjson"
    if(params.accessToken) params.headers.Authorization = "Bearer " + params.accessToken    
    if(params.server) api("request:fetch", {
        url: url,
        params: params
    }, result => callback(result))
    else fetch(url, params).then(
        response => response.text().then(
            text => {                                 
                if(params.asJson || params.asNdjson){
                    try{
                        let obj
                        if(params.asNdjson){                            
                            obj = text.split("\n").filter(line => line.length).map(line => JSON.parse(line))
                        }else{
                            obj = JSON.parse(text)
                        }                                                
                        try{
                            callback({ok: true, content: obj})
                        }catch(err){
                            console.log(err, obj)
                        }
                    }catch(err){
                        console.log("fetch parse json error", err)
                        callback({ok: false, status: "Error: Could not parse json."})
                    }
                }else{
                    callback({ok: true, content: text})
                }                
            },
            err => {
                console.log("fetch get response text error", err)                
                callback({ok: false, status: "Error: Failed to get response text."})
            }
        ),
        err => {
            console.log("fetch error", err)
            callback({ok: false, status: "Error: Failed to fetch."})
        }
    )
}

function api(topic, payload, callback){
    fetch('/api', {
        method: "POST",
        headers: {
           "Content-Type": "application/json"
        },
        body: JSON.stringify({
            topic: topic,
            payload: payload
        })
    }).then(
        response => response.text().then(
            text => {
                try{                    
                    let response = JSON.parse(text)
                    callback(response)
                }catch(err){
                    console.log("parse error", err)
                    callback({error: "Error: Could not parse response JSON."})
                }                
            },
            err => {
                console.log("api error", err)
                callback({error: "Error: API error in get response text."})
            }
        ),
        err => {
            console.log("api error", err)
            callback({error: "Error: API error in fetch."})
        }
    )
}

function storeLocal(key, obj){
    localStorage.setItem(key, JSON.stringify(obj))
}

function getLocal(key, def){
    let stored = localStorage.getItem(key)
    if(stored) return JSON.parse(stored)
    return def
}

class NdjsonReader{
    constructor(url, processLineFunc, accessTokenOpt, onTerminated){
        this.url = url
        this.processLineFunc = processLineFunc
        this.accessTokenOpt = accessTokenOpt
        this.onTerminated = onTerminated
    }

    processChunk(chunk){            
        let content = this.pendingChunk + ( this.nodeReader ? chunk.toString() : new TextDecoder("utf-8").decode(chunk.value) )
        if(content.length > 1) console.log(content)
        let closed = content.match(/\n$/)
        let hasline = content.match(/\n/)
        let lines = content.split("\n")                
        if(hasline){
            if(!closed){
                this.pendingChunk = lines.pop()
            }
            for(let line of lines){
                if(line != "") this.processLineFunc(JSON.parse(line))
            }            
        }else{
            this.pendingChunk += content
        }        
        return true
    }

    read(){        
        this.reader.read().then(
            chunk => {
                if(chunk.done){
                    if(this.onTerminated) this.onTerminated()
                    return false
                }
                this.processChunk(chunk)
                this.read()
            },
            err => console.log(err)
        )    
    }

    stream(){        
        let headers = {
            "Accept": "application/x-ndjson"
        }        

        if(this.accessTokenOpt) headers.Authorization = `Bearer ${this.accessTokenOpt}`
        
        fetch(this.url, {
            headers: headers
        }).then(
            response => {        
                this.pendingChunk = ""
                this.nodeReader = false
                try{
                    this.reader = response.body.getReader()
                    this.read()        
                }catch(err){                    
                    console.log("could not get reader, trying node reader")                                        
                    this.nodeReader = true
                    response.body.on('data', (chunk) => {                        
                        this.processChunk(chunk)
                    })
                    response.body.on('end', () => {
                        try{
                            this.onTerminated()
                        }catch(err){}
                    })
                }                
            },
            err => {
                console.log(err)
            }
        )
    }
}

function getclassforpiece(p, style){
    let kind = p.kind
    if(p.color == WHITE) kind = "w" + kind
    return ( style || "alpha" ) + "piece" + kind
}

class Vect_{
    constructor(x, y){
        this.x = x
        this.y = y
    }

    p(v){
        return Vect(this.x + v.x, this.y + v.y)
    }

    m(v){
        return Vect(this.x - v.x, this.y - v.y)
    }

    l(){
        return Math.sqrt(this.x*this.x + this.y*this.y)
    }

    s(s){
        return Vect(s*this.x, s*this.y)
    }
}
function Vect(x,y){return new Vect_(x,y)}

function getStyle(className) {
    let cssText = ""
    for(let si=0;si<document.styleSheets.length;si++){
        let classes = document.styleSheets[si].rules || document.styleSheets[0].cssRules
        for (let x = 0; x < classes.length; x++) {                            
            if (classes[x].selectorText == className) {
                cssText += classes[x].cssText || classes[x].style.cssText
            }         
        }
    }    
    return cssText
}

function scoretocolor(score){
    return Math.floor(Math.min(( Math.abs(score) / 1000.0 ) * 192.0 + 63.0, 255.0))
}

function scoretorgb(score){
    return `rgb(${score < 0 ? scoretocolor(score) : 0},${score > 0 ? scoretocolor(score) : 0},0)`
}

//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
seed = 1
function random(){
    seed += 1
    x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function randcol(){
	return Math.floor(128 + random() * 128)
}

function randrgb(){
	return `rgb(${randcol()},${randcol()},${randcol()})`
}

function getelse(obj, key, defaultvalue){
    if(key in obj) return obj[key]
    return defaultvalue
}

function createZip(content, nameOpt){
    let name = nameOpt || "backup"

    let zip = new JSZip()

    zip.file(name, content)

    return zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }            
    })
}

function unZip(content, nameOpt){
    let name = nameOpt || "backup"
    
    let unzip = new JSZip()            

    return P(resolve => {
        unzip.loadAsync(content, {base64: true}).then(unzip =>
            unzip.file(name).async("text").then(content => resolve(content)))
    })        
}

function downloadcontent(content, name){
    let file = new Blob([content])
    let a = document.createElement("a")
    let url = URL.createObjectURL(file)
    a.href = url
    a.download = name || "download.txt"
    document.body.appendChild(a)        
    a.click()
    setTimeout(function(){
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }, 0)
}

function blobToDataURL(blob) {return P(resolve => {
    readFile(blob, "readAsDataURL").then(ev => {
        resolve(ev.target.result)
    })
})}

function md2html(content){
    let html = markdownconverter.makeHtml(content)
    html = html.replace(/<a href=/g, `<a rel="noopener noreferrer" target="_blank" href=`)
    return html
}

const MOVE_COLOR_PRESETS = {
    "0,0": "#99f",
    "0,1": "#f00"
}

function movecolor(weights){
    let presetkey = `${weights[0]},${weights[1]}`
    let preset = MOVE_COLOR_PRESETS[presetkey]
    if(preset){
        return preset
    }
    return `rgb(${weights[1] ? 255 - weights[1]/10*255 : 0},${(160+weights[0]/10*95)*(weights[1] > 0 ? 0.7 : 1)},0)`
}

function scrollBarSize(){
    return 14
}

function displayNameForVariantKey(variantKey){
    return variantKey.substring(0,1).toUpperCase() + variantKey.substring(1)
}

function pgnVariantToVariantKey(pgnVariant){    
    return pgnVariant.substring(0,1).toLowerCase() + pgnVariant.substring(1)
}

function parsePgnPartsFromLines(lines){
    let parseHead = true
    let parseBody = false
    let headers = []
    let bodyLines = []

    // remove leading empty lines
    while(lines.length && (!lines[0])) lines.shift()
    
    do{
        let line = lines.shift()
        let m
        if(parseHead){
            if(!line){
                parseHead = false
            }else if(m = line.match(/^\[([^ ]+) \"([^\"]+)/)){                
                headers.push([m[1], m[2]])
            }else{
                parseHead = false
                lines.unshift(line)
            }
        }else{
            if(parseBody){
                if(!line){
                    return [lines, headers, bodyLines.join("\n")]
                }else{
                    bodyLines.push(line)
                }
            }else if(line){
                parseBody = true
                bodyLines.push(line)
            }
        }
    }while(lines.length)
    
    return [lines, headers, bodyLines.join("\n")]
}

function confirm(msg, ack){
    let conf = window.prompt(`${msg} Type " ${ack} " to confirm.`)

    return conf == ack
}

module.exports = {
    P: P,
    RP: RP,
    simpleFetch: simpleFetch,
    GET_PROPS: GET_PROPS,
    GET_USER: GET_USER,
    NdjsonReader: NdjsonReader,    
}

module.exports.SECOND = SECOND
module.exports.MINUTE = MINUTE
module.exports.HOUR = HOUR
module.exports.DAY = DAY
module.exports.WEEK = WEEK
module.exports.MONTH = MONTH
module.exports.YEAR = YEAR

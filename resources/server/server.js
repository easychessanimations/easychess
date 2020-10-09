const rateLimit = require("express-rate-limit")

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW || "300000"),
  max: parseInt(process.env.RATE_MAX || "50")
})

const play = require('./play')
const monitor = require('./monitor')
const { LichessBot } = require('../client/nodejs/lichessbot')
const utils = require('../client/nodejs/utils')
if((!process.env.SKIP_FIREBASE) && (!process.env.SKIP_TOURNEYWATCH)) require('./tourneywatch')
else console.log("skip tourneywatch")
let discordbot = null
if(!process.env.SKIP_DISCORD_BOT) discordbot = require('./discordbot')
else console.log("skip discord bot")

const serverCreatedAt = new Date()
const serverCreatedAtStr = serverCreatedAt.toLocaleString()

const EXT_TO_MEDIA_TYPE = {
    ogg: "ogg",
    ogv: "ogg",
    mp3: "mpeg",
}

const GAMES_EXPORT_REPO = "easychessgames"

const SSE_STARTUP_DELAY = IS_DEV() ? 250 : 3000

const SITE_HOST = process.env.SITE_HOST || "easychess.herokuapp.com"

if(process.env.BOT_TOKEN && (!process.env.SKIP_BOT)){

    try{

        let b = LichessBot({
            token: process.env.BOT_TOKEN,
            acceptVariant: process.env.BOT_VARIANT || "atomic",
            useBotBook: true
        })
        
        console.log("created", b)
        
        b.stream()

    }catch(err){
        console.log("Bot could not be started.", err)
    }

}else{
    console.log("skip bot")
}

const express = require('express')
var passport = require('passport');
var LichessStrategy = require('passport-lichess').Strategy;
var DiscordStrategy = require('passport-discord').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
const path = require('path')
const { spawn, exec } = require('child_process')
const fs = require('fs')
const fetch = require('node-fetch')
const { getFiles } = require('../utils/fileutils')
const { YEAR, HOUR, MINUTE } = require('../shared/js/commonutils')
const liapi = require('liapi')

var admin = null
var firebase = null
var bucket = null
var db = null
var firestore = null

if(process.env.SKIP_OAUTH){
    console.log("skip oauth")
}else{
    passport.use(new LichessStrategy({
        clientID: process.env.LICHESS_CLIENT_ID,
        clientSecret: process.env.LICHESS_CLIENT_SECRET,
        callbackURL: IS_DEV() ?
            'http://localhost:3000/auth/lichess/callback'
        :
            `https://${SITE_HOST}/auth/lichess/callback`
    },
    function(accessToken, refreshToken, profile, cb) {
        clog(`id : ${profile.id}\naccessToken : ${accessToken}\nrefreshToken : ${refreshToken}`)
        profile.accessToken = accessToken
        return cb(null, profile)
    }
    ))

    passport.use("discord", new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        scope: "identify",
        callbackURL: IS_DEV() ?
            'http://localhost:3000/auth/discord/callback'
        :
            `https://${SITE_HOST}/auth/discord/callback`
    },
    function(accessToken, refreshToken, profile, cb) {
        clog(`id : ${profile.id}\naccessToken : ${accessToken}\nrefreshToken : ${refreshToken}`)
        profile.accessToken = accessToken
        return cb(null, profile)
    }
    ))

    passport.use("github", new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        scope: "",
        callbackURL: IS_DEV() ?
            'http://localhost:3000/auth/github/callback'
        :
            `https://${SITE_HOST}/auth/github/callback`
    },
    function(accessToken, refreshToken, profile, cb) {
        clog(`id : ${profile.id}\naccessToken : ${accessToken}\nrefreshToken : ${refreshToken}`)
        profile.accessToken = accessToken
        return cb(null, profile)
    }
    ))

    passport.use('lichess-bot', new LichessStrategy({
        clientID: process.env.LICHESS_BOT_CLIENT_ID,
        clientSecret: process.env.LICHESS_BOT_CLIENT_SECRET,
        scope: "challenge:read challenge:write bot:play",
        callbackURL: IS_DEV() ?
            'http://localhost:3000/auth/lichess/bot/callback'
        :
            `https://${SITE_HOST}/auth/lichess/bot/callback`
    },
    function(accessToken, refreshToken, profile, cb) {
        clog(`id : ${profile.id}\naccessToken : ${accessToken}\nrefreshToken : ${refreshToken}`)
        profile.accessToken = accessToken
        profile.isBot = true
        return cb(null, profile)
    }
    ))
}

passport.serializeUser(function(user, cb) {
    cb(null, user)
})
  
passport.deserializeUser(function(obj, cb) {
    cb(null, obj)
})

const app = express()

app.use(limiter)

app.get('/firebase/sacckey.json', function(req, res) {  
    res.send("Forbidden.")
})

const { readJson } = require('../utils/rwjson')
const { update } = require('../utils/octokit')
const sse = require('./sse')
const { AbstractEngine, VARIANT_TO_ENGINE } = require('../shared/js/chessboard')
const { fromchunks } = require('../utils/firebase')

const PORT = process.env.PORT || 3000

const MAX_SSE_CONNECTIONS = parseInt(process.env.MAX_SSE_CONNECTIONS || "100")

const QUERY_INTERVAL = parseInt(process.env.QUERY_INTERVAL || "30000")

const TICK_INTERVAL = parseInt(process.env.TICK_INTERVAL || "10000")

let AUTH_TOPICS = [
    "bucket:put",
    "bucket:get",
    "git:put",    
    "liapi:getstate",
    "liapi:writestate",
    "liapi:login",
    "liapi:jointourney",
    "liapi:createtourney",
]

if(!process.env.ALLOW_SERVER_ENGINE) AUTH_TOPICS = AUTH_TOPICS.concat(["engine:go", "engine:stop"])

function IS_DEV(){
    return !!process.env.EASYCHESS_DEV
}

function IS_PROD(){
    return !IS_DEV()
}

function getVer(obj, field){
    if(!obj[field]) return ""
    return `?ver=${obj[field].mtime}`
}

function clog(msg){
    if(IS_DEV()) console.log(msg)
}

const __rootdirname = path.join(__dirname, '../..')

if(process.env.SKIP_FIREBASE){
    console.log("skip firebase")
}else{
    let sacckeypath = path.join(__rootdirname, "firebase/sacckey.json")

    fromchunks(sacckeypath)

    admin = require("firebase-admin")

    firebase = admin.initializeApp({
        credential: admin.credential.cert(sacckeypath),
        storageBucket: "pgneditor-1ab96.appspot.com",
        databaseURL: "https://pgneditor-1ab96.firebaseio.com/"
    })

    bucket = admin.storage().bucket()
    db = admin.database()
    firestore = firebase.firestore()

    bucket.upload(path.join(__rootdirname, "ReadMe.md"), {destination: "ReadMe.md"}, (err, _, apiResponse)=>{
        console.log(err ? "bucket test failed" : `bucket test ok, uploaded ReadMe.md, size ${apiResponse.size}`)
    })    
    //db.ref("test").set("test")
    /*db.ref("test").on("value", function(snapshot) {
        console.log(`db ${snapshot.val()} ok`)
    }, function (errorObject) {
        console.log(`db test failed ${errorObject.code}`)
    })*/
}

app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: true }))
const session = require('express-session')
const FirestoreStore = require( 'firestore-store' )(session);
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 12 * HOUR
    },
    store: firestore ? new FirestoreStore({
        database: firestore
    }) : undefined
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(monitor.monitor)

if(!process.env.SKIP_OAUTH){
    app.get('/auth/lichess',
    passport.authenticate('lichess'))

    app.get('/auth/lichess/callback', 
        passport.authenticate('lichess', { failureRedirect: '/?login-lichess=failed' }),
            function(req, res) {
                res.redirect(IS_DEV() ?
                    'http://localhost:3000/?login-lichess=ok'
                :
                    `https://${SITE_HOST}/?login-lichess=ok`)
            }
    )

    app.get('/auth/discord',
    passport.authenticate('discord'))

    app.get('/auth/discord/callback', 
        passport.authenticate('discord', { failureRedirect: '/?login-discord=failed' }),
            function(req, res) {
                res.redirect(IS_DEV() ?
                    'http://localhost:3000/?login-discord=ok'
                :
                    `https://${SITE_HOST}/?login-discord=ok`)
            }
    )

    app.get('/auth/github',
    passport.authenticate('github'))

    app.get('/auth/github/callback', 
        passport.authenticate('github', { failureRedirect: '/?login-github=failed' }),
            function(req, res) {
                res.redirect(IS_DEV() ?
                    'http://localhost:3000/?login-github=ok'
                :
                    `https://${SITE_HOST}/?login-github=ok`)
            }
    )

    app.get('/auth/lichess/bot',
    passport.authenticate('lichess-bot'))

    app.get('/auth/lichess/bot/callback', 
        passport.authenticate('lichess-bot', { failureRedirect: '/?login-lichess-bot=failed' }),
            function(req, res) {
                res.redirect(IS_DEV() ?
                    'http://localhost:3000/?login-lichess-bot=ok'
                :
                    `https://${SITE_HOST}/?login-lichess-bot=ok`)
            }
    )
}

const STOCKFISH_PATH = path.join(__dirname, "bin/stockfish")
const FAIRY_PATH = path.join(__dirname, "bin/fairy")
const GOCHESS_PATH = path.join(__dirname, "bin/zurimain")

let clientScripts = readJson('resources/conf/clientscripts.json')[IS_DEV() ? "dev" : "prod"]
let clientStyleSheets = readJson('resources/conf/clientstylesheets.json')[IS_DEV() ? "dev" : "prod"]

let versionInfo = readJson('resources/conf/versioninfo.json')

let loadScripts = clientScripts.map(script=>
    `<script src="${script}${getVer(versionInfo, script)}"></script>`).join("\n")

let loadStyleSheets = clientStyleSheets.map(stylesheet=>
    `<link href="${stylesheet}${getVer(versionInfo, stylesheet)}" rel="stylesheet" />`).join("\n")

app.use(express.static(__rootdirname))

let sseconnections = []
app.use(sse)

app.get('/stream', function(req, res) {  
    res.sseSetup()  
    sseconnections.push(res)
    setTimeout(_ => {        
        res.sseSend(play.sendGameBlob())
        res.sseSend(play.sendGamesBlob())
        monitor.sendOnlineUsers()
    }, SSE_STARTUP_DELAY)
    while(sseconnections.length > MAX_SSE_CONNECTIONS) sseconnections.shift()
    clog(`new stream ${req.hostname} conns ${sseconnections.length}`)
})

function ssesend(obj){    
    for(let i = 0; i < sseconnections.length; i++){
        sseconnections[i].sseSend(obj)
    }
}

function apisend(obj, error, res){
    if(typeof obj == "string") obj = {
        status: obj
    }
    obj.error = error || null
    if(!obj.error) obj.ok = true
    res.send(JSON.stringify(obj))
}

function setcommandVariantEngine(command, payload, res){
    let engineKey = VARIANT_TO_ENGINE[payload.variant || "standard"]
    if(!engineKey){
        apisend({}, `Error: No engine for variant ${payload.variant} .`, res)
        return
    }
    if(!engines[engineKey]){
        apisend({}, `Error: Engine is being loaded for variant ${payload.variant} . Please try again .`, res)
        return
    }
    engines[engineKey].setcommand(command, payload)    
    apisend(`engine:${command} issued`, null, res)
}

const HANDLERS = {
    "api:ping": function(res, _){        
        apisend(`api:pong`, null, res)
    },
    "liapi:getstate": function(res, _){                
        apisend({state: liapi.state}, null, res)
    },
    "liapi:writestate": function(res, payload){                        
        liapi.writestate(payload.liapiState)    
        liapi.state = payload.liapiState
        apisend(`liapi:writestate done`, null, res)
    },
    "liapi:login": function(res, payload){        
        liapi.login(payload.liapiUsername, payload.liapiPassword)
        apisend(`liapi:login done`, null, res)
    },
    "liapi:jointourney": function(res, payload){        
        liapi.jointourney(payload.liapiTourneyId, payload.liapiUsername, payload.liapiTourneyPassword, payload.liapiTeamId)
        apisend(`liapi:jointourney done`, null, res)
    },
    "liapi:createtourney": function(res, payload){        
        liapi.createtourney(payload.liapiUsername, payload.liapiTemplate)
        apisend(`liapi:createtourney done`, null, res)
    },
    "request:fetch": function(res, payload){        
        let url = payload.url
        let params = payload.params
        fetch(url, params).then(
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
                            if(params.asContent){
                                apisend({content: obj}, null, res)                            
                            }else{
                                apisend(obj, null, res)                            
                            }                            
                        }catch(err){
                            console.log("fetch parse json error", err)                            
                            apisend(`Error: Could not parse json.`, err, res)
                        }
                    }else{                        
                        apisend({content: text}, null, res)
                    }                
                },
                err => {
                    console.log("fetch get response text error", err)                                    
                    apisend(`"Error: failed to get response text."`, err, res)
                }
            ),
            err => {
                console.log("fetch error", err)                
                apisend(`"Error: Failed to fetch."`, err, res)
            }
        )
    },
    "engine:go": function(res, payload){        
        if(process.env.ALLOW_SERVER_ENGINE) payload.threads = 1      
        setcommandVariantEngine("go", payload, res)      
    },
    "engine:stop":function(res, payload){
        setcommandVariantEngine("stop", payload, res)      
    },
    "bucket:put":function(res, payload){    
        let filename = payload.filename || "backup"    
        let content = payload.content
        clog(`put bucket ${filename} content size ${content.length}`)
        fs.writeFile("temp.txt", content, function(err) {
            clog("written file locally")
            bucket.upload("temp.txt", {destination: filename}, (err, _, apiResponse)=>{
                clog(`upload result ${err} ${apiResponse}`)
                apisend({apiResponse: apiResponse}, err, res)
            })    
        })
      },
      "bucket:get":function(res, payload){    
        if(!bucket){
            apisend({}, `Error: No bucket.`, res)          
            return
        }
        let filename = payload.filename || "backup"
        clog("downloading", filename)
        bucket.file(filename).download((err, contents)=>{
            if(err){
                apisend({}, `Error: Not found.`, res)          
            }else{
                apisend({content: contents.toString()}, null, res)
            }            
        })
      },
      "git:put":function(res, payload){    
        let filename = payload.filename || "backup/backup.txt"    
        let content = payload.content
        clog(`git put ${filename} content size ${content.length}`)
        update(payload.owner, payload.repo, filename, content, result => {
          if(result.error) apisend({}, result.status, res)
          else apisend(result.status, null, res)
        })        
      },
      "git:exportgame":function(res, payload){    
        let ID = utils.UID().replace("uid_", "game_")
        let filename = "gamexport/" + ID + ".txt"
        let content = payload.content
        clog(`git exportgame ${filename} content size ${content.length}`)
        update(payload.owner, GAMES_EXPORT_REPO, filename, content, result => {
          if(result.error) apisend({}, result.status, res)
          else apisend({
              status: result.status,
              ID: ID,
              filename: filename
          }, null, res)
        })        
      }
}  

app.use(express.json({limit: '100MB'}))

app.post('/botgame', (req, res) => {                
    let body = req.body

    update("easychessanimations", "botgame", `${body.botName} ${body.opponentName} ${body.id}`, JSON.stringify(body, null, 2), result => {
      if(result.error) {}
      else {}
    })        
})

app.post('/logtab', (req, res) => {                
    let body = req.body

    update("easychessanimations", "logtab", `${body.username} ${body.caption}`, JSON.stringify(body, null, 2), result => {
      if(result.error) {}
      else {}
    })
})

app.post('/logmove', (req, res) => {                
    let body = req.body

    update("easychessanimations", "logmove", `${body.username} ${body.san}`, JSON.stringify(body, null, 2), result => {
      if(result.error) {}
      else {}
    })
})

app.post('/api', (req, res) => {                
    let body = req.body
  
    let topic = body.topic  
    let payload = body.payload

    if(!(["api:ping"].includes(topic))) clog(topic)
  
    if(AUTH_TOPICS.includes(topic)){
        if(payload.password != process.env.PASSWORD){
            apisend({}, "Error: Not authorized.", res)
            clog("not authorized")
            return
        }
    }

    let m = topic.match(/^play:(.+)$/)

    if(m){
        try{
            play.api(m[1], payload, req, res)
        }catch(err){
            console.log("play api error", err)
            apisend({}, "Error: Play API error.", res)
        }

        return
    }
  
    try{
        HANDLERS[topic](res, payload)    
    }catch(err){
        console.log("api error", err)
        apisend({}, "Error: API error.", res)
    }  
})

const PROPS = {    
    IS_DEV: IS_DEV(),
    QUERY_INTERVAL: QUERY_INTERVAL,
    TICK_INTERVAL: TICK_INTERVAL,
    LOG_REMOTE_URL: process.env.LOG_REMOTE_URL || "https://fbserv.herokuapp.com/games.html?ref=",
    ACCEPT_VARIANT: process.env.ACCEPT_VARIANT,
    ALLOW_SERVER_ENGINE: !!process.env.ALLOW_SERVER_ENGINE,
    imagestore: getFiles(path.join(__rootdirname, "resources/client/img/imagestore")),
    backgrounds: getFiles(path.join(__rootdirname, "resources/client/img/backgrounds")),
    readme: fs.readFileSync(path.join(__rootdirname, "ReadMe.md")).toString()
}

class ServerEngine extends AbstractEngine{
    constructor(sendanalysisinfo, path){
        super(sendanalysisinfo, path)

        if(!path.match("zurimain")) this.minDepth = 10
    }

    processstdout(data){
        data = data.replace(/\r/g, "")        
        for(let line of data.split("\n")){            
            this.processstdoutline(line)
        }
    }

    spawnengineprocess(){
        this.process = spawn(this.path)

        this.process.stdout.on('data', (data)=>{
            this.processstdout(`${data}`)
        })

        this.process.stderr.on('data', (data)=>{
            this.processstdout(`${data}`)
        })
    }

    sendcommandtoengine(command){
        clog(`engine command : ${command}`)
        this.process.stdin.write(command + "\n")     
    }
}

const engines = {
    stockfish: new ServerEngine(ssesend, STOCKFISH_PATH),
    fairy:  new ServerEngine(ssesend, FAIRY_PATH),    
}

if(IS_PROD()) setInterval(function(){
    ssesend({kind: "tick"})
}, TICK_INTERVAL)

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

const soundFiles = getFiles(path.join(__rootdirname, "resources/client/sound"))

function htmlForSoundFile(sf){
    let mn = sf.match(/^([^\.]+)\.(.*)/)
    let name = mn[1]
    let ext = mn[2]
    let mediaType = EXT_TO_MEDIA_TYPE[ext]
    return `
<audio id="${name}">
<source src="resources/client/sound/${sf}" type="audio/${mediaType}">
</audio>
`
}

app.get('/', (req, res) => {

if(process.env.SITE_HOST == "easychessreserve.herokuapp.com"){
    if(new Date().getDate() < 23){
        //res.redirect("https://easychess.herokuapp.com")
        res.send(`
<div style="margin-left:10%;width:80%;text-align:center;font-size:22px;background-color:#fbb;padding:10px;">
<p>Easychess runs on a free Heroku account which has a monthly quota of 550 hours.</p>
<p>In the first part of the month you should use the main site.</p>
<p>This reserve site is for the time when the main site is down due to using up quota.</p>
<p>Please in the first part of the month don't visit this reserve site.</p>
<p>Soon you will be redirected to the main site, or if you are impatient, click <a href="https://easychess.herokuapp.com">easychess.herokuapp.com</a> .</p>
</div>
<script>
setTimeout(_=>document.location.href="https://easychess.herokuapp.com", 20000)
</script>
`)
        return
    }
}

res.send(`
<!DOCTYPE html>
<html lang="en">

    <head>

        <meta charset="utf-8">
        <title>Easy Chess</title>    

        <link rel="icon" href="/resources/client/favicon.ico" />

        <script>
        const PROPS = ${JSON.stringify({...PROPS, ...{
            USER: req.user,
            LOG_REMOTE: req.query.nolog != "true"
        }}, null, 2)}
        </script>

        ${loadStyleSheets}

        ${loadScripts}

    </head>

    <body>    

        ${soundFiles.map(sf => htmlForSoundFile(sf)).join("\n")}

        <div id="root"></div>

        <script src='resources/client/js/index.js?ver=${versionInfo['resources/client/js/index.js'].mtime}'></script>

    </body>

</html>
`)
})

app.get('/node', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="en">

    <head>

        <meta charset="utf-8">
        <title>Easy Chess Node</title>    

        <link rel="icon" href="/resources/client/favicon.ico" />

        <script>
        const PROPS = ${JSON.stringify({...PROPS, ...{
            USER: req.user,
            LOG_REMOTE: req.query.nolog != "true",
            BOT_TOKEN: process.env.BOT_TOKEN,
        }}, null, 2)}
        </script>

        ${loadStyleSheets}

    </head>

    <body>    

        <div id="root"></div>

        <script src='dist/js/bundle.js?ver=${versionInfo['dist/js/bundle.js'].mtime}'></script>

    </body>

</html>
`))

app.get('/gif.worker.js', function(req, res) {  
    res.sendFile(`${__rootdirname}/resources/client/cdn/gif.worker.js`)
})

app.get('/book.worker.js', function(req, res) {  
    res.sendFile(`${__rootdirname}/resources/client/js/book.worker.js`)
})

app.get('/online', function(req, res) {  
    let online_all = monitor.online_all
    let keys = []
    let lichess_profiles = []
    for(let key in online_all){
        online_all[key].firstSeenTime = new Date(online_all[key].firstSeen).toLocaleTimeString()
        online_all[key].lastSeenTime = new Date(online_all[key].lastSeen).toLocaleTimeString()
        online_all[key].onlineDurationMins = (online_all[key].lastSeen - online_all[key].firstSeen)/60000
        keys.push(key)
        if(online_all[key].provider == "lichess"){
            lichess_profiles.push(online_all[key].username)
        }
    }
    res.send(
`
server created at ${serverCreatedAtStr}
<br><br>
<b>${keys.length}</b> user(s) : ${keys.map(key => `${key} ( ${Math.floor(online_all[key].onlineDurationMins)} )`).join(" , ")}
<br>
${lichess_profiles.map(username => `<a href="https://lichess.org/@/${username}" rel="noopener noreferrer" target="_blank">${username}</a>`).join(" | ")}
<br><br>
${Object.keys(monitor.online).map((key,i) => `${i+1}. <a href="https://lichess.org/@/${monitor.online[key].username}" rel="noopener noreferrer" target="_blank">${monitor.online[key].username}</a>`).join(" | ")}
<br><br>
${play.getChatMessages().map(msg=>`<b>${msg.author.username}</b> ${msg.msg}`).join("<br>")}
<br>
<pre>
${JSON.stringify(online_all, null, 2)}
${JSON.stringify(play.getChatMessages(), null, 2)}
</pre>
<script>
document.title = "${Object.keys(monitor.online).length} ${Object.keys(monitor.online).reverse().map(key => monitor.online[key].username).join(" ")}"
setTimeout(_=>document.location.reload(), 30000)
</script>`
    )
})

if(process.env.KEEPALIVE){
    let keepalive = parseInt(process.env.KEEPALIVE)
    let keepaliveInterval = setInterval(()=>{
        console.log("keepalive, remaining", --keepalive)
        fetch(`https://${SITE_HOST}/?keepalive=true`)
        if(!keepalive) clearInterval(keepaliveInterval)
    }, 10 * MINUTE)    
}

if(process.env.OTHER_SITE) fetch(process.env.OTHER_SITE)

play.init(apisend, ssesend, bucket, discordbot)

monitor.setSendOnlineUsersFunc(online => {
    ssesend({
        kind: "online",
        online: online
    })
})

if(IS_DEV()){
    engines.gochess = new ServerEngine(ssesend, GOCHESS_PATH)
}else setTimeout(_ => {
    if(bucket){
        let engineName = IS_DEV() ? "zurimain_upload.exe" : "zurimain_upload"
        console.log("downloading engine", engineName)
        bucket.file(engineName).download((err, contents)=>{
            if(err){
                console.log("engine download failed", err)
            }else{
                localFileName = engineName.replace("_upload", "")
                console.log("saving engine as", localFileName)
                fs.writeFileSync(path.join(__dirname, "bin", localFileName), contents)
                exec("chmod a+x resources/server/bin/*", (error, stdout, stderr) => {
                    if (error) {
                        console.log(`chmod error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`chmod stderr: ${stderr}`);
                        return;
                    }
                    console.log(`chmod stdout: ${stdout}`);
                    engines.gochess = new ServerEngine(ssesend, GOCHESS_PATH)
                });                
            }            
        })
    }
}, 20000)

app.listen(PORT, () => console.log(`easychess server serving from < ${__rootdirname} > listening on port < ${PORT} >!`))

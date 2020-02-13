(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { LichessBot } = require('./lichessbot')
const utils = require('./utils')

let b = LichessBot({
    token: utils.GET_PROPS().BOT_TOKEN,
    acceptVariant: "atomic"
})

console.log("created", b)

b.stream()

},{"./lichessbot":3,"./utils":4}],2:[function(require,module,exports){
const utils = require('./utils')

const P = utils.P
const simpleFetch = utils.simpleFetch

const LICHESS_LOGIN_URL             = "/auth/lichess"
const LICHESS_BASE_URL              = "https://lichess.org"
const LICHESS_ANALYSIS_URL          = LICHESS_BASE_URL + "/analysis"
const LICHESS_GAMES_URL             = LICHESS_BASE_URL + "/api/games/user"
const LICHESS_LEADERBOARD_URL       = LICHESS_BASE_URL + "/player/top"
const LICHESS_USERS_URL             = LICHESS_BASE_URL + "/api/users"
const LICHESS_USER_URL              = LICHESS_BASE_URL + "/api/user"
const LICHESS_MAX_LEADERBOARD_NB    = 200
const LICHESS_MAX_USER_IDS          = 300

function lichessAnalysisUrl(fenOpt, variantOpt){
    let fen = fenOpt || STANDARD_START_FEN
    let variant = variantOpt || DEFAULT_VARIANT

    return `${LICHESS_ANALYSIS_URL}/${variant}/${fen}`
}

function lichessGamesUrl(username, optsOpt){
    let opts = optsOpt || {}

    return `${LICHESS_GAMES_URL}/${username}?${Object.entries(opts).map(opt => opt[0] + "=" + opt[1]).join("&")}`
}

function lichessGameUrl(gameId){
    return LICHESS_BASE_URL + "/" + gameId
}

function getLichessLeaderBoard(perfOpt, nbOpt){
    let perf = perfOpt || DEFAULT_PERF
    let nb = nbOpt || LICHESS_MAX_LEADERBOARD_NB

    return P(resolve => {
        simpleFetch(`${LICHESS_LEADERBOARD_URL}/${nb}/${perf}`,
        {
            asVndLichessV3Json: true,
            server: true
        }, result => {                
            if(result.ok){
                resolve(result.users)
            }
        })
    })
}

function fetchLichessUsers(userIds){
    return P(resolve => {
        simpleFetch(LICHESS_USERS_URL, {
            method: "POST",
            body: userIds.slice(0, Math.min(LICHESS_MAX_USER_IDS, userIds.length)).join(","),
            asJson: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function getLichessUserFollow(userId, kindOpt){
    let kind = kindOpt || "following"
    return P(resolve => {
        simpleFetch(`${LICHESS_USER_URL}/${userId}/${kind}`, {
            asNdjson: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function getLichessGames(username, optsOpt, accessTokenOpt){
    let url = lichessGamesUrl(username, optsOpt)

    return P(resolve => {
        simpleFetch(url, {
            asNdjson: true,
            accessToken : accessTokenOpt
        }, result => resolve(result))
    })
}

const LICHESS_BOOK_URL              = "https://explorer.lichess.ovh/lichess"

const LICHESS_BOOK_MAX_MOVES        = 12
const LICHESS_BOOK_AVG_RATINGS      = [ 1600, 1800, 2000, 2200, 2500 ]
const LICHESS_BOOK_TIME_CONTROLS    = [ "bullet", "blitz", "rapid", "classical" ]

function requestLichessBook(fenOpt, variantOpt, maxMovesOpt, ratingListOpt, speedListOpt){
    let fen = fenOpt || STANDARD_START_FEN
    let variant = variantOpt || DEFAULT_VARIANT
    let maxMoves = maxMovesOpt || LICHESS_BOOK_MAX_MOVES
    let ratingList = ratingListOpt || LICHESS_BOOK_AVG_RATINGS
    let speedList = speedListOpt || LICHESS_BOOK_TIME_CONTROLS

    let ratings = ratingList.map(opt => `ratings%5B%5D=${opt}`).join("&")

    let speeds = speedList.map(opt => `speeds%5B%5D=${opt}`).join("&")

    let url = LICHESS_BOOK_URL +`?fen=${fen}&moves=${maxMoves}&variant=${variant}`

    if(ratings) url += "&" + ratings

    if(speeds) url += "&" + speeds

    return P(resolve => {
        simpleFetch(url, {
            asJson: true
        }, result => {
            if(result.ok){                
                result.content.fen = fen
                resolve(result.content)
            }
        })
    })    
}

const AI_LEVEL_2_RATING = {
    1: 1350,
    2: 1420,
    3: 1500,
    4: 1600,
    5: 1700,
    6: 1900,
    7: 2200,
    8: 2600
  }
  
function ailevel2rating(ailevel){  
let rating = AI_LEVEL_2_RATING[ailevel]
if(!rating) return 1500
return rating
}

class LichessGame_{

    constructor(obj, myUsername){

        this.orig = obj

        this.id = obj.id

        this.positions = obj.positions

        this.createdAt = obj.createdAt

        this.moves = []
        if(obj.moves) this.moves = obj.moves.split(" ")

        if(!obj.players.white) obj.players.white = {}
        if(!obj.players.black) obj.players.black = {}

        this.whiteAILevel = obj.players.white.aiLevel || 0
        this.blackAILevel = obj.players.black.aiLevel || 0

        if(!obj.players.white.user) obj.players.white.user = {
            id: "none",
            name: `Stockfish AI level ${this.whiteAILevel}`,
            rating: ailevel2rating(this.whiteAILevel)
        }

        if(!obj.players.black.user) obj.players.black.user = {
            id: "none",
            name: `Stockfish AI level ${this.blackAILevel}`,
            rating: ailevel2rating(this.blackAILevel)
        }

        this.myUsername = myUsername

        this.whiteName = obj.players.white.user.name
        this.blackName = obj.players.black.user.name

        this.meWhite = this.myUsername.toLowerCase() == this.whiteName.toLowerCase()
        this.meBlack = this.myUsername.toLowerCase() == this.blackName.toLowerCase()

        this.hasMe = this.meWhite || this.meBlack

        this.myColor = "none"
        if(this.meWhite) this.myColor = "white"
        if(this.meBlack) this.myColor = "black"

        this.opponentName = this.meWhite ? this.blackName : this.whiteName
        
        this.whiteTitle = obj.players.white.user.title || ""
        this.blackTitle = obj.players.black.user.title || ""

        this.whiteBot = this.whiteTitle == "BOT"
        this.blackBot = this.blackTitle == "BOT"

        this.oppKind = "human"

        if(this.meWhite && this.blackBot) this.oppKind = "bot"
        if(this.meBlack && this.whiteBot) this.oppKind = "bot"

        this.someBot = this.whiteBot || this.blackBot

        this.whiteTitledName = this.whiteTitle == "" ? this.whiteName : this.whiteTitle + " " + this.whiteName
        this.blackTitledName = this.blackTitle == "" ? this.blackName : this.blackTitle + " " + this.blackName

        this.opponentTitledName = this.meWhite ? this.blackTitledName : this.whiteTitledName

        this.whiteRating = obj.players.white.rating
        this.blackRating = obj.players.black.rating

        if(obj.clock){
            this.clockInitial = obj.clock.initial
            this.clockIncrement = obj.clock.increment
            this.clockStr = `${this.clockInitial} + ${this.clockIncrement}`
        }else{
            this.clockInitial = "?"
            this.clockIncrement = "?"
            this.clockStr = `?`
        }        

        this.winner = obj.winner

        this.result = 0.5
        this.resultStr = "1/2 - 1/2"        
        this.myResult = 0.5        

        if(this.winner){            
            if(this.winner == "white"){
                this.result = 1
                this.resultStr = "1-0"
                this.myResult = this.myUsername.toLowerCase() == this.whiteName.toLowerCase() ? 1 : 0
            }else{
                this.result = 0
                this.resultStr = "0-1"
                this.myResult = this.myUsername.toLowerCase() == this.blackName.toLowerCase() ? 1 : 0
            }
        }                

        this.perf = obj.perf        
        this.variant = obj.variant || "?"
        
        if(this.perf == "correspondence"){
            this.perf = this.perf + " " + this.variant
            if(obj.daysPerTurn){
                this.clockStr = obj.daysPerTurn + " day(s)"
            }
        }

        this.whiteTitled = ( this.whiteTitle != "" ) && ( !this.whiteBot )
        this.blackTitled = ( this.blackTitle != "" ) && ( !this.blackBot )
        this.someTitled = ( this.whiteTitled || this.blackTitled )
        this.opponentTitle = this.meWhite ? this.blackTitle : this.whiteTitle
        this.opponentTitled = ( ( this.meWhite && this.BlackTitled ) || ( this.meBlack && this.whiteTitled ) )

        this.meWon = ( this.myResult == 1 )
        this.meLost = ( this.myResult == 0 )
        this.draw = ( this.result == 0.5 )

        this.rated = obj.rated        

        this.whiteHuman = (!this.whiteBot) && (!this.whiteAILevel)
        this.blackHuman = (!this.blackBot) && (!this.blackAILevel)        
        this.bothHuman = this.whiteHuman && this.blackHuman

        this.humanRated = this.bothHuman && this.rated

        this.myRating = undefined
        if(this.meWhite) this.myRating = this.whiteRating
        if(this.meBlack) this.myRating = this.blackRating

        this.opponentRating = undefined
        if(this.meWhite) this.opponentRating = this.blackRating
        if(this.meBlack) this.opponentRating = this.whiteRating

        this.ratingDiff = undefined
        if(this.myRating && this.opponentRating) this.ratingDiff = this.myRating - this.opponentRating

        this.plies = 0
        try{
        this.plies = obj.moves.split(" ").length
        }catch(err){console.log(err)}

        if(this.ratingDiff){
            this.effRatingDiff = this.ratingDiff
            if(this.meBlack) this.effRatingDiff -= 200

            this.surpriseDraw = false

            if((this.effRatingDiff > 0) && (this.result == 0.5)) this.surpriseDraw = true
        }

        for(let variant of SUPPORTED_VARIANTS.map(entry => entry[0])){
            ["White", "Black"].forEach(color =>
                this[`${variant}HumanRated${color}`] = rating =>
                    ( this.orig.variant == variant ) &&
                    ( this.oppKind == "human" ) &&
                    this.rated &&
                    this.opponentRating &&
                    ( this.opponentRating >= rating ) &&
                    this[`me${color}`]
            )

            this[`${variant}HumanRatedSince`] = date =>
                ( this.orig.variant == variant ) &&
                ( this.oppKind == "human" ) &&
                ( this.createdAt >= new Date(date).getTime() ) &&
                this.rated
        }
    }

    get summary(){
        return `${this.whiteTitledName} ( ${this.whiteRating} ) - ${this.blackTitledName} ( ${this.blackRating} ) [ ${this.perf} ${this.clockStr} ] ${this.resultStr}`
    }

    get summarypadded(){        
        return `${this.meLost ? "( * )" : this.surpriseDraw ? "( ? )" : "_____"} ${this.whiteTitledName.padEnd(20, "_")} ( ${this.whiteRating} ) - ${this.blackTitledName.padEnd(20, "_")} ( ${this.blackRating} ) ${this.resultStr.padEnd(9, "_")} [ ${this.clockStr.padEnd(10, "_")} ${this.perf.padEnd(12, "_")} ]`
    }

}
function LichessGame(obj, myUsername){return new LichessGame_(obj, myUsername)}

const LICH_API_GAMES_EXPORT = "api/games/user"

function lichapiget(path, headers, token, callback, errcallback){

    args = {...{
        method: "GET"
    }, headers}

    if ( token ){
        args.headers.Authorization= `Bearer ${token}`
    }

    let fullpath = "https://lichess.org/" + path

    fetch(fullpath, args).then(
        (response) => response.text().then(
            (content) => callback(content),
            (err) => errcallback(err)
        ),
        err => errcallback(err)
    )

}

function processgames(user, callback, content){        
    try{        
        let games = content.split("\n").filter((x)=>x.length > 0).map((x)=>LichessGame(JSON.parse(x), user))
        callback(games)
    }catch(err){console.log(content, err)}
}

function getlichessgames(user, token, max, callback){
    lichapiget(LICH_API_GAMES_EXPORT + `/${user}?max=${max}`, {Accept: "application/x-ndjson"}, token, processgames.bind(null, user, callback), processgames)
}

/////////////////////////////////////////////////
// bot

const LICHESS_BOT_LOGIN_URL             = "/auth/lichess/bot"
const LICHESS_BOT_UPGRAGE_URL           = LICHESS_BASE_URL + "/api/bot/account/upgrade"
const LICHESS_STREAM_EVENTS_URL         = LICHESS_BASE_URL + "/api/stream/event"
const LICHESS_CHALLENGE_URL             = LICHESS_BASE_URL + "/api/challenge"
const LICHESS_STREAM_GAME_STATE_URL     = LICHESS_BASE_URL + "/api/bot/game/stream"
const LICHESS_BOT_GAME_URL              = LICHESS_BASE_URL + "/api/bot/game"

function upgradeLichessBot(accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_BOT_UPGRAGE_URL, {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            server: true,
            asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function acceptLichessChallenge(challengeId, accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_CHALLENGE_URL + "/" + challengeId + "/accept", {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function declineLichessChallenge(challengeId, accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_CHALLENGE_URL + "/" + challengeId + "/decline", {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function makeLichessBotMove(gameId, algeb, offeringDraw, accessToken){
    return P(resolve => {
        let offeringDrawQuery = offeringDraw ? "?offeringDraw=true" : ""
        simpleFetch(LICHESS_BOT_GAME_URL + "/" + gameId + "/move/" + algeb + offeringDrawQuery, {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function writeLichessBotChat(gameId, room, text, accessToken){    
    return P(resolve => {
        let formData = new FormData()
        formData.append("room", room)
        formData.append("text", text)
        simpleFetch(LICHESS_BOT_GAME_URL + "/" + gameId + "/chat", {
            method: "POST",
            body: `room=${room}&text=${text}`,
            accessToken : accessToken,
            asForm: true,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

const LICHESS_TOURNAMENT_PAGE = "https://lichess.org/tournament"

module.exports = {
    LICHESS_STREAM_EVENTS_URL: LICHESS_STREAM_EVENTS_URL,
    LICHESS_STREAM_GAME_STATE_URL: LICHESS_STREAM_GAME_STATE_URL,
    acceptLichessChallenge: acceptLichessChallenge
}

/*
{
  "type": "challenge",
  "challenge": {
    "id": "4x4HczZc",
    "status": "created",
    "challenger": {
      "id": "lishadowapps",
      "name": "lishadowapps",
      "title": null,
      "rating": 2182,
      "online": true,
      "lag": 4
    },
    "destUser": {
      "id": "atomicroulettebot",
      "name": "AtomicRouletteBot",
      "title": "BOT",
      "rating": 2025,
      "online": true
    },
    "variant": {
      "key": "atomic",
      "name": "Atomic",
      "short": "Atom"
    },
    "rated": false,
    "speed": "bullet",
    "timeControl": {
      "type": "clock",
      "limit": 60,
      "increment": 0,
      "show": "1+0"
    },
    "color": "random",
    "perf": {
      "icon": ">",
      "name": "Atomic"
    }
  }
}
*/

},{"./utils":4}],3:[function(require,module,exports){
const lichess = require('./lichess')
const utils = require('./utils')

class LichessBotGame_{
    constructor(props){
        this.parentBot = props.parentBot
        this.id = props.id        

        this.gameStateReader = new utils.NdjsonReader(lichess.LICHESS_STREAM_GAME_STATE_URL + "/" + this.id, this.processGameEvent.bind(this), this.parentBot.token, this.processTermination.bind(this))

        this.gameStateReader.stream()
    }

    processGameEvent(event){
        console.log(JSON.stringify(event, null, 2))
    }

    processTermination(){

    }
}
function LichessBotGame(props){return new LichessBotGame_(props)}

class LichessBot_{
    constructor(props){
        this.token = props.token

        this.acceptVariant = props.acceptVariant

        if(props.acceptVariant){
            if(typeof props.acceptVariant == "string") this.acceptVariant = props.acceptVariant.split(" ")
        }

        this.minInitialClock = props.minInitialClock || 60
    }

    toString(){
        return `bot ${this.token}`
    }

    challengeRefused(msg){
        console.log("Challenge refused .", msg)
    }

    processBotEvent(event){
        console.log(JSON.stringify(event, null, 2))

        if(event.type == "challenge"){
            let challenge = event.challenge

            if(this.acceptVariant){
                if(!this.acceptVariant.includes(challenge.variant.key)){
                    return this.challengeRefused(`Wrong variant . Acceptable variant(s) : ${this.acceptVariant.join(" , ")} .`)            
                }
            }

            if(challenge.timeControl.limit < this.minInitialClock){
                return this.challengeRefused(`Initial clock too low . Minimum initial clock : ${this.minInitialClock} sec(s) .`)            
            }

            lichess.acceptLichessChallenge(event.challenge.id, this.token)
        }else if(event.type == "gameStart"){
            LichessBotGame({
                parentBot: this,
                id: event.game.id
            })
        }
    }

    stream(){
        this.challengeReader = new utils.NdjsonReader(lichess.LICHESS_STREAM_EVENTS_URL, this.processBotEvent.bind(this), this.token)

        this.challengeReader.stream()
    }
}
function LichessBot(props){return new LichessBot_(props)}

module.exports.LichessBot = LichessBot

},{"./lichess":2,"./utils":4}],4:[function(require,module,exports){
const P = p => new Promise(p)

function GET_PROPS(){    
    if(typeof PROPS != "undefined"){
        return PROPS
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

    read(){
        this.reader.read().then(
            chunk => {
                if(chunk.done){
                    if(this.onTerminated) this.onTerminated()
                    return
                }
                let content = this.pendingChunk + new TextDecoder("utf-8").decode(chunk.value)
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
                    this.read()
                }else{
                    this.pendingChunk += content
                }
            },
            err => {
                console.log(err)
            }
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
                this.reader = response.body.getReader()
                this.read()        
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
    simpleFetch: simpleFetch,
    GET_PROPS: GET_PROPS,
    NdjsonReader: NdjsonReader
}

},{}]},{},[1]);

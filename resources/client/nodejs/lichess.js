const utils = require('./utils')
const FormData = require('form-data')

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
    LICHESS_BOOK_MAX_MOVES: LICHESS_BOOK_MAX_MOVES,
    LICHESS_BOOK_AVG_RATINGS: LICHESS_BOOK_AVG_RATINGS,
    LICHESS_BOOK_TIME_CONTROLS: LICHESS_BOOK_TIME_CONTROLS,
    acceptLichessChallenge: acceptLichessChallenge,
    writeLichessBotChat: writeLichessBotChat,
    makeLichessBotMove: makeLichessBotMove,
    requestLichessBook: requestLichessBook,
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

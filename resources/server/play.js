const { Bucket } = require('./bucket')

const { Chat, ChatMessage, Game, Player, UNSEAT } = require('../shared/js/chessboard')

var apisend, ssesend, bucket, discordPackage

var stateBucket, gamesBucket

var game = Game()

var games = []

function sendGameBlob(){    
    return({
        kind: "play:updategame",
        game: game.serialize()
    })
}

function sendGame(){
    ssesend(sendGameBlob())
}

function sendGamesBlob(){    
    return({
        kind: "play:games",
        games: games
    })
}

function sendGames(){
    ssesend(sendGamesBlob())
}

function init(setApisend, setSsesend, setBucket, setDiscordPackage){
    apisend = setApisend
    ssesend = setSsesend
    bucket = setBucket
    discordPackage = setDiscordPackage

    stateBucket = new Bucket("easychessgamestate", bucket)

    stateBucket.get().then(
        json => {
            console.log(`loaded game state`)
            game = Game().fromblob(json)
            sendGame()
        },
        err => {
            console.log(err)
        }
    )

    gamesBucket = new Bucket("easychessgames", bucket)

    gamesBucket.get().then(
        json => {
            games = json
            console.log(`loaded games`)            
            sendGames()
        },
        err => {
            console.log(err)
        }
    )

    setTimeout(initDiscord, 20000)
}

function sendDiscordLiveMessage(msg){
    console.log(msg)

    try{
        if(discordPackage.discordbot){
            let client = discordPackage.discordbot.client

            client.channels.cache.get(discordPackage.livechannel)
                .send(msg)

            let playLinkMsg = process.env.PLAY_LINK_MESSAGE || `https://easychess.herokuapp.com/?ubertab=play`

            client.channels.cache.get(discordPackage.livechannel)
                .send(playLinkMsg)
        }
    }catch(err){console.log(err)}
}

function initDiscord(){    
    sendDiscordLiveMessage(`easychess BOT logged in`)
}

function saveGameState(){    
    if(stateBucket){
        stateBucket.put(game.serialize())
    }
}

const MAX_STORED_GAMES = process.env.MAX_STORED_GAMES || 100

function saveGames(){    
    while(games.length > MAX_STORED_GAMES) games.pop()

    if(gamesBucket){
        gamesBucket.put(games)
    }
}

setInterval(_ => saveGameState(), parseInt(process.env.GAME_STATE_STORE_INTERVAL || 5) * 60 * 1000)

setInterval(_ => {
    if(game.checkTurnTimedOut()){
        sendGame()
    }
}, 1000)

function assert(req, res, props){
    if(props.login){
        if(!req.user){
            apisend({
                alert: props.login,
                alertKind: "error"
            }, null, res)
            sendGame()
            return false
        }
    }
    if(props.gameNotInProgess){
        if(game.inProgress){
            apisend({}, props.gameNotInProgess, res)
            sendGame()
            return false
        }        
    }
    if(props.gameInProgess){
        if(!game.inProgress){
            apisend({}, props.gameInProgess, res)
            sendGame()
            return false
        }        
    }
    if(props.canMakeMove){
        if(!game.canMakeMove(props.player)){
            apisend({
                alert: props.canMakeMove,
                alertKind: "error"
            }, null, res)
            sendGame()
            return false
        }        
    }
    return true
}

function handleGameOperationResult(result, res, apiOkMessage){
    if(result === true){
        apisend(apiOkMessage, null, res)                        
    }
    else{
        apisend({
            alert: result,
            alertKind: "error"
        }, null, res)
    }
    sendGame()
}

function gameTerminated(){
    games.unshift(game.serialize())

    saveGameState()

    saveGames()
    sendGames()

    let msg =
`> game terminated : *${game.playersVerbal()}*
> **${game.resultVerbal()} ${game.resultReason}**`    
    
    sendDiscordLiveMessage(msg)
}

function gameStarted(){
    saveGameState()

    let msg = `> game started : *${game.playersVerbal()}*`    

    sendDiscordLiveMessage(msg)
}

function api(topic, payload, req, res){
    game.terminationCallback = gameTerminated
    game.startCallback = gameStarted

    let player = Player({...req.user, ...{index: payload.index}})

    switch(topic){        
        case "postChatMessage":
            let chatMessage = ChatMessage(payload.chatMessage)
            game.chat.postMessage(chatMessage)
            apisend(`playapi:chatMessagePosted`, null, res)
            sendGame()
            break
        case "setTimecontrol":            
            if(!assert(req, res, {
                login: `Log in to set time control.`,
                gameNotInProgess: `Error: Cannot set time control for game in progress.`
            })) return                        
            handleGameOperationResult(
                game.setTimecontrol(player, payload),
                res, `playapi:timecontrolSet`
            )
            break
        case "offerDraw":            
            if(!assert(req, res, {
                login: `Log in to offer a draw.`,
                gameInProgess: `Error: Cannot offer draw for game not in progress.`
            })) return                                    
            handleGameOperationResult(
                game.offerDraw(player),
                res, `playapi:drawOffered`
            )                         
            break
        case "revokeDraw":            
            if(!assert(req, res, {
                login: `Log in to revoke a draw.`,
                gameInProgess: `Error: Cannot revoke draw for game not in progress.`
            })) return                                    
            handleGameOperationResult(
                game.revokeDraw(player),
                res, `playapi:drawRevoked`
            )                         
            break
        case "sitPlayer":            
            if(!assert(req, res, {
                login: `Log in to sit.`,
                gameNotInProgess: `Error: Cannot sit for game in progress.`
            })) return                                    
            handleGameOperationResult(
                game.sitPlayer(player),
                res, `playapi:playerSeated`
            )                         
            break
        case "unseatPlayer":            
            if(!assert(req, res, {
                login: `Log in to unseat.`,
                gameNotInProgess: `Error: Cannot unseat for game in progress.`
            })) return                                    
            handleGameOperationResult(
                game.sitPlayer(player, UNSEAT),
                res, `playapi:playerUnseated`
            )            
            break
        case "makeMove":            
            if(!assert(req, res, {
                login: `Log in to make a move.`,
                gameInProgess: `Error: Cannot make move for a game not in progress.`,
                canMakeMove: `Not allowed to make move for other side.`,
                player: player,                
            })) return                                                            
            handleGameOperationResult(
                game.makeSanMoveResult(payload.san),
                res, `playapi:moveMade`
            )                        
            break
        case "resignPlayer":            
            if(!assert(req, res, {
                login: `Log in to resign.`,
                gameInProgess: `Error: Cannot resign a game not in progress.`,                
            })) return                                                            
            handleGameOperationResult(
                game.resignPlayer(player),
                res, `playapi:playerResigned`
            )                                    
            break
    }
}

module.exports = {
    init: init,
    api: api,
    sendGameBlob: sendGameBlob,
    sendGamesBlob: sendGamesBlob
}

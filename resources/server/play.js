const { Chat, ChatMessage, Game, Player, UNSEAT } = require('../shared/js/chessboard')

var apisend, ssesend

function init(setApisend, setSsesend){
    apisend = setApisend
    ssesend = setSsesend
}

let game = Game()

function sendGameBlob(){    
    return({
        kind: "play:updategame",
        game: game.serialize()
    })
}

function sendGame(){
    ssesend(sendGameBlob())
}

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
            apisend({}, props.gameNotInProgess)
            sendGame()
            return false
        }        
    }
    if(props.gameInProgess){
        if(!game.inProgress){
            apisend({}, props.gameInProgess)
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

function api(topic, payload, req, res){
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
    sendGameBlob: sendGameBlob
}

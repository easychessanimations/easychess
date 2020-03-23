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

function api(topic, payload, req, res){
    let player = Player({...req.user, ...{index: payload.index}})
    let result

    switch(topic){        
        case "postChatMessage":
            let chatMessage = ChatMessage(payload.chatMessage)
            game.chat.postMessage(chatMessage)
            apisend(`playapi:chatMessagePosted`, null, res)
            ssesend(sendGameBlob())
            break
        case "setTimecontrol":            
            if(!req.user){
                apisend({
                    alert: `Log in to set time control.`,
                    alertKind: "error"
                }, null, res)
                return
            }
            if(game.inProgress){
                apisend({}, `Error: Cannot set time control for game in progress.`)
                return
            }
            result = game.setTimecontrol(player, payload)
            if(result === true){
                apisend(`playapi:timecontrolSet`, null, res)                
                ssesend(sendGameBlob())
            }
            else apisend({
                alert: result,
                alertKind: "error"
            }, null, res)
            break
        case "unseatPlayer":            
            if(!req.user){
                apisend({
                    alert: `Log in to unseat.`,
                    alertKind: "error"
                }, null, res)
                return
            }
            if(game.inProgress){
                apisend({}, `Error: Cannot unseat for game in progress.`)
                return
            }
            result = game.sitPlayer(player, UNSEAT)
            if(result === true){
                apisend(`playapi:playerUnseated`, null, res)                
                ssesend(sendGameBlob())
            }
            else apisend({
                alert: result,
                alertKind: "error"
            }, null, res)
            break
        case "makeMove":            
            if(!game.inProgress){
                apisend({}, `Error: Cannot make move for a game not in progress.`, res)
                ssesend(sendGameBlob())
                return
            }
            if(!req.user){
                apisend({
                    alert: `Log in to make a move.`,
                    alertKind: "error"
                }, null, res)
                ssesend(sendGameBlob())
                return
            }                 
            if(!game.canMakeMove(player)){
                apisend({
                    alert: `Not allowed to make move for other side.`,
                    alertKind: "error"
                }, null, res)
                ssesend(sendGameBlob())
                return
            }
            if(game.makeSanMove(payload.san)){
                apisend(`playapi:moveMade`, null, res)                                
            }
            else apisend({
                alert: `Illegal move.`,
                alertKind: "error"
            }, null, res)
            ssesend(sendGameBlob())
            break
        case "resignPlayer":            
            if(!game.inProgress){
                apisend({}, `Error: Cannot resign a game not in progress.`, res)
                return
            }
            if(!req.user){
                apisend({
                    alert: `Log in to resign.`,
                    alertKind: "error"
                }, null, res)
                return
            }                        
            result = game.resignPlayer(player)
            if(result === true){
                apisend(`playapi:playerResigned`, null, res)                
                ssesend(sendGameBlob())
            }
            else apisend({
                alert: result,
                alertKind: "error"
            }, null, res)
            break
        case "sitPlayer":            
            if(!req.user){
                apisend({
                    alert: `Log in to sit.`,
                    alertKind: "error"
                }, null, res)
                return
            }
            if(game.inProgress){
                apisend({}, `Error: Cannot sit for game in progress.`, res)
                return
            }
            result = game.sitPlayer(player)
            if(result === true){                
                apisend(`playapi:playerSeated`, null, res)                                
                ssesend(sendGameBlob())
            }
            else apisend({
                alert: result,
                alertKind: "error"
            }, null, res)
            break
    }
}

module.exports = {
    init: init,
    api: api,
    sendGameBlob: sendGameBlob
}

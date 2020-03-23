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
        case "sitPlayer":            
            if(!req.user){
                apisend({
                    alert: `Log in to sit.`,
                    alertKind: "error"
                }, null, res)
                return
            }
            if(game.inProgress){
                apisend({}, `Error: Cannot sit for game in progress.`)
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

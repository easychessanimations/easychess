const { Chat, ChatMessage } = require('../shared/js/chessboard')

var apisend, ssesend

function init(setApisend, setSsesend){
    apisend = setApisend
    ssesend = setSsesend
}

let chat = Chat()

function sendChatBlob(){
    return({
        kind: "play:updatechat",
        chat: chat.serialize()
    })
}

function api(topic, payload, res){
    switch(topic){
        case "postChatMessage":
            let chatMessage = ChatMessage(payload.chatMessage)
            chat.postMessage(chatMessage)
            apisend(`playapi:chatMessagePosted`, null, res)
            ssesend(sendChatBlob())
            break
    }
}

module.exports = {
    init: init,
    api: api,
    sendChatBlob: sendChatBlob
}

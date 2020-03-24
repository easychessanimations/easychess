var online = {}

const FORGET_DELAY = 60 * 1000

var sendOnlineUsersFunc = null

function setSendOnlineUsersFunc(func){
    sendOnlineUsersFunc = func
}

function sendOnlineUsers(){
    if(sendOnlineUsersFunc){
        sendOnlineUsersFunc(online)
    }
}

module.exports = {
    setSendOnlineUsersFunc: setSendOnlineUsersFunc,
    sendOnlineUsers: sendOnlineUsers,
    online: online,
    monitor: function (req, res, next) {
        let changed = false

        if(req.user){
            let userPath = `${req.user.id}@${req.user.provider}`

            if(!online[userPath]) changed = true

            online[userPath] = {
                id: req.user.id,
                provider: req.user.provider,
                username: req.user.username,
                lastSeen: new Date().getTime()
            }
        }

        for(let userPath in online){
            let user = online[userPath]

            if( (new Date().getTime() - user.lastSeen) > FORGET_DELAY ){                                
                changed = true
                delete online[userPath]
            }             
        }

        req.online = online

        if(changed){            
            sendOnlineUsers()
        }

        next()
    }
}

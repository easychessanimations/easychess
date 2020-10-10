const { update } = require('../utils/octokit')

var online = {}
var online_all = {}

const FORGET_DELAY = parseInt(process.env.FORGET_DELAY || "300000")

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
    online_all: online_all,
    monitor: function (req, res, next) {
        let changed = false

        if(req.user){
            let userPath = `${req.user.id}@${req.user.provider}`

            if(!online[userPath]) changed = true

            if(changed){
                online[userPath] = {
                    id: req.user.id,
                    provider: req.user.provider,
                    username: req.user.username,
                    firstSeen: new Date().getTime()
                }

                update("easychessanimations", "botlogin", `${req.user.username} login`, JSON.stringify(online[userPath], null, 2), result => {
                  if(result.error) {}
                  else {}
                })        
            }
            
            online[userPath].lastSeen = new Date().getTime()

            online_all[userPath] = online[userPath]
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

            update("easychessanimations", "logonline", `Total ${Object.keys(online).length} - ` + Object.keys(online).map(userPath => online[userPath].username).join(" "), JSON.stringify(online, null, 2), result => {
              if(result.error) {}
              else {}
            })        
        }

        next()
    }
}

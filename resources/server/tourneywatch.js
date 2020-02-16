const utils = require('../client/nodejs/utils')
const lichess = require('../client/nodejs/lichess')
const WebSocket = require('ws')

let conns = {}

function connect(tid){
    if(conns[tid]){        
        conns[tid].close()
    }

    let ws = new WebSocket(`wss://socket.lichess.org/tournament/${tid}/socket/v4?sri=fvXA_FtoWrXY&v=0`, {
        headers: {
            Cookie: `lila2=${process.env.BOT_COOKIE}`
        }
    })

    conns[tid] = ws

    ws.on('open', function open() {
        console.log(`socket for ${tid} opened`)        
    })
      
    ws.on('message', function incoming(data) {
        //console.log(data)
    })

    ws.on('close', function open() {
        console.log(`socket for ${tid} closed`)        
    })

    setInterval(() => {
        ws.send("null")
    }, 3000)
}

function watch(){
    lichess.getLichessTourneys().then(tourneys => {    
        let ts = tourneys[0].created.concat(tourneys[0].started)
        let ats = ts.filter(t => t.variant.key == process.env.BOT_VARIANT || "atomic")
        for(let t of ats) connect(t.id)
    })
}

if(process.env.BOT_COOKIE){
    watch()
    let interval = 2
    let envInterval = process.env.TOURNEY_WATCH_INTERVAL
    if(envInterval) interval = parseInt(envInterval)
    console.log(`Watching tourney with interval ${interval} min(s) .`)
    setInterval(watch, interval * utils.MINUTE)
}

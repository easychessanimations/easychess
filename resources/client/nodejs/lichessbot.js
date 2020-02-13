const lichess = require('./lichess')
const utils = require('./utils')

class LichessBot_{
    constructor(props){
        this.token = props.token
    }

    toString(){
        return `bot ${this.token}`
    }

    processBotEvent(event){
        console.log(event)
    }

    stream(){
        this.challengeReader = new utils.NdjsonReader(lichess.LICHESS_STREAM_EVENTS_URL, this.processBotEvent.bind(this), this.token)

        this.challengeReader.stream()
    }
}
function LichessBot(props){return new LichessBot_(props)}

module.exports.LichessBot = LichessBot

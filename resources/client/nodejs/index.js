const { LichessBot } = require('./lichessbot')
const utils = require('./utils')

let b = LichessBot({
    token: utils.GET_PROPS().BOT_TOKEN,
    acceptVariant: "atomic"
})

console.log("created", b)

b.stream()

const { LichessBot } = require('./lichessbot')
const utils = require('./utils')

let props = utils.GET_PROPS()
console.log(props)
let token = props.BOT_TOKEN
if(props.USER) if(props.USER.accessToken) token = props.USER.accessToken

let b = LichessBot({
    token: token,
    acceptVariant: "atomic",
    useBotBook: true
})

console.log("created", b)

b.stream()
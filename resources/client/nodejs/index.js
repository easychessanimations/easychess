const { LichessBot } = require('./lichessbot')
const utils = require('./utils')

let props = utils.GET_PROPS()
console.log(props)

let token = props.BOT_TOKEN

if(props.USER) if(props.USER.accessToken) token = props.USER.accessToken

let variant = "atomic"

if(props.ACCEPT_VARIANT) variant = props.ACCEPT_VARIANT

if(typeof process.env.BOT_VARIANT != "undefined") variant = process.env.BOT_VARIANT

let b = LichessBot({
    token: token,
    acceptVariant: variant,
    useBotBook: true
})

console.log("created", b)

b.stream()
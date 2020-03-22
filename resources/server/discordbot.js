const Discord = require('discord.js')
const client = new Discord.Client()

client.on('ready', _ => {
    console.log(`discord bot logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
    if (msg.content === 'ping'){
        msg.reply('pong')
    }
})

try{
    client.login(process.env.DISCORD_BOT_TOKEN)
}catch(err){
    console.log(`discord login failed`)
}

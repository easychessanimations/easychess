const Discord = require('discord.js')
const client = new Discord.Client()

const livechannel = process.env.LIVE_CHANNEL || "694116000710524978"

async function purgeLivechannel(){
    let channel = client.channels.cache.get(livechannel)
    const fetched = await channel.messages.fetch({limit: process.env.PURGE_LIVE_CHANNEL_LIMIT || 100})    

    let prev = null

    let del = 0
    fetched.forEach(message => {                
        let messageAgeHours = Math.round((new Date().getTime() - message.createdTimestamp)/1000/3600)
        let purgeAgeLimitHours = process.env.PURGE_AGE_LIMIT_HOURS || 24
        if(messageAgeHours > purgeAgeLimitHours){
            if(prev){
                if(prev.content.match(/^easychess BOT logged in/)){
                    if(message.content.match(/^https/)){
                        prev.delete()
                        message.delete()
                        del++
                    }
                }
            }
        }
        prev = message        
    })

    console.log("purged", del, "live message(s)")
}

client.on('ready', _ => {
    console.log(`discord bot logged in as ${client.user.tag}!`)

    purgeLivechannel()
})

async function bulkDelete(channel, limit){
    console.log("bulk delete", channel.id, limit)
    const fetched = await channel.messages.fetch({limit: limit + 1})    
    fetched.forEach(message => {
        message.delete()
    })
}

client.on('message', msg => {
    let content = msg.content

    if(content === 'ping'){
        msg.reply('pong')
    }

    let m

    if(msg.member.guild.me.hasPermission("ADMINISTRATOR")){
        ////////////////////////////////////////////////
        // ADMIN

        console.log("admin message", content)

        if(m = content.match(/^!del (\d+)/)){
            bulkDelete(msg.channel, parseInt(m[1]))
        }

        ////////////////////////////////////////////////
    }
})

try{
    client.login(process.env.DISCORD_BOT_TOKEN)
}catch(err){
    console.log(`discord login failed`)
}

module.exports = {
    client: client,
    livechannel: livechannel,
}

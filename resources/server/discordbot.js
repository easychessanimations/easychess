const Discord = require('discord.js')
const client = new Discord.Client()

client.on('ready', _ => {
    console.log(`discord bot logged in as ${client.user.tag}!`)
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

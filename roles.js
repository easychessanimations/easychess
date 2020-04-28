const Discord = require('discord.js')
const client = new Discord.Client()

try{
    client.login(process.env.DISCORD_BOT_TOKEN)
}catch(err){
    console.log(`discord login failed`)
}

client.on('ready', _ => {
    console.log(`discord bot logged in as ${client.user.tag}!`)

    let guild = client.guilds.cache.get('691236172738854915')

    let roles = guild.roles

    /*roles.create({
        data: {
          name: 'Inventor',
          color: 'BLUE',
        },
        reason: 'we need an inventor',
      })
        .then(console.log)
        .catch(console.error);

    console.log(roles)*/

    let adminRole = roles.cache.find(role => role.name === "Admin")

    adminRole.setPermissions(["ADMINISTRATOR"])

    //let inventorRole = roles.cache.find(role => role.name === "Inventor")

    //console.log(adminRole)

    let members = guild.members

    members.cache.forEach(
        member => {
            /*if(member.user.username == "lishadowapps"){                
                member.roles.set([adminRole])
            }*/

            /*if(member.user.username == "Jeff K"){                
                member.roles.set([inventorRole])
            }*/
        }
    )

})

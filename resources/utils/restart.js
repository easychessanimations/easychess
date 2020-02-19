console.log("restart")

function formation(heroku, app, quantity){
    console.log("formation", heroku, app, quantity)
    heroku.patch(`/apps/${app}/formation/web`, {body: {
        quantity: quantity
    }}).then(response => {
        console.log(response)
    })
}

for(let key in process.env){
    let m
    if(m = key.match(/^HEROKU_RESTART_TOKEN_(.*)/)){
        let app = m[1].toLowerCase()

        console.log("restarting", app)

        const Heroku = require('heroku-client')
        const heroku = new Heroku({ token: process.env[key] })
        
        formation(heroku, app, 0)
        setTimeout(() => formation(heroku, app, 1), 3000)
    }
}

module.exports = function (req, res, next) {
    res.sseSetup = function() {
        res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
        })
    }

    res.sseSend = function(data) {
        let blob = "data: " + JSON.stringify(data) + "\n\n"        
        res.write(blob);
    }

    next()
}

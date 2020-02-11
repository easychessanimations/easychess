// book worker

importScripts("resources/shared/js/chessboard.js")

let cache = {}

function createBook(bookgames, fen, variant){
    let path = `${variant}/${fen}/${bookgames.length}`

    let cached = cache[path]

    if(cached){
        cached.buildtime = 0
        return cached
    }

    let start = performance.now()

    let origb = ChessBoard().setfromfen(fen, variant)
    let lms = origb.legalmovesforallpieces()
    let bookmoves = []

    for(let lm of lms){
        let b = ChessBoard().setfromfen(fen, variant)
        
        b.push(lm)

        let movepositions = bookgames.filter(lg => (lg.positions || []).find(fen => strippedfen(fen) == strippedfen(b.fen)))

        let wins = 0
        let draws = 0
        let losses = 0
        let plays = 0

        for(let lg of movepositions){            
            if(lg.myResult == 1) wins++
            else if(lg.myResult == 0.5) draws++
            else losses++
            plays++
        }

        b.pop()

        if(plays){
            let item = {
                fen: fen,
                san: b.movetosan(lm),
                plays: plays,
                wins: wins,
                draws: draws,
                losses: losses
            }
    
            item.perf = Math.round(item.wins / item.plays * 100)

            bookmoves.push(item)
        }
    }

    bookmoves.sort((a,b) => b.plays - a.plays)

    let elapsed = performance.now() - start

    let result = {
        action: "renderFilterBook",
        bookmoves: bookmoves,
        fen: fen,
        buildtime: elapsed
    }

    cache[path] = result

    return result
}

onmessage = function(message){
    let data = message.data  

    if(data.action == "createBook"){
        postMessage(createBook(data.bookgames, data.fen, data.variant))
    }
}

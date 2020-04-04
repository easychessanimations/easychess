if(typeof ChessBoard == "undefined"){
    var { ChessBoard } = require('./resources/shared/js/chessboard')
}

b = ChessBoard().setfromfen()

let nodes = 0

let start = new Date().getTime()

function perfRec(depth, maxDepth){
    nodes++

    if(depth > maxDepth) return

    let lms = b.legalmovesforallpieces()

    for(lm of lms){
        b.push(lm)
        perfRec(depth+1, maxDepth)
        b.pop()
    }
}

perfRec(0, 3)

let elapsed = ( new Date().getTime() - start ) / 1000

console.log(elapsed, nodes, nodes / elapsed)

const { ChessBoard, setDebugBoard } = require('./resources/shared/js/chessboard')

let b = ChessBoard().setfromfen("jlse1qkbnr/ppp1pppp/3p4/8/4P1s1/5N2/PPPP1PPP/JLneSQKB1R w KQkq - 2 3 -", "eightpiece")

let move = b.santomove("Ke2")

b.push(move)

console.log(b.fen)

/*let b = ChessBoard().setfromfen("jlse1qkbnr/ppp1pp1p/3p2p1/8/3NP3/5s2/PPP1KPPP/JLneSQ1B1R w KQkq - 0 5 d4f3", "eightpiece")

let move = b.santomove("Nf5")

b.push(move)

move = b.santomove("Kxf3")

console.log(b.legalmovesforallpieces())*/
const { ChessBoard, Square, Piece } = require('./resources/shared/js/chessboard')

let b = ChessBoard().setfromfen("jlse1qkbnr/ppp1pp1p/3p2p1/5N2/4P3/5s2/PPP1KPPP/JLneSQ1B1R b kq - 1 5 -", "eightpiece")

let pslms = b.pseudolegalmovesforpieceatsquareinnerpartial(Piece("s", false), Square(5, 5))

console.log(pslms.map(pslm => b.movetosan(pslm)))

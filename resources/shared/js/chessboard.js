const NON_CHESS960 = true

const MAX_PLMS_GEN_DEPTH = 1

const SUPPORTED_VARIANTS = [
    ["standard", "Standard"],
    ["atomic", "Atomic"],
    ["seirawan", "S-Chess"],
    ["eightpiece", "8-Piece"]
]

const VARIANT_TO_ENGINE = {
    standard: "stockfish",
    atomic: "stockfish",
    seirawan: "fairy",
    eightpiece: "gochess"
}

const VARIANT_TO_LOCAL_ENGINE = {
    standard: "stockfish",
    atomic: "stockfish",
    seirawan: null,
    eightpiece: null
}

const SUPPORTED_PERFS = [
    ["bullet", "Bullet"],
    ["blitz", "Blitz"],
    ["atomic", "Atomic"]
]

const DISPLAY_FOR_PIECE_LETTER = {    
    p: "Pawn",
    n: "Knight",
    b: "Bishop",
    r: "Rook",
    q: "Queen",
    k: "King",
    e: "Elephant",
    h: "Hawk",
}

function displayNameForVariant(variant){
    let fv = SUPPORTED_VARIANTS.find(sv => sv[0] == variant)
    if(!fv) return "?"
    return fv[1]
}

const DEFAULT_VARIANT = "standard"

const DEFAULT_PERF = "bullet"

const STANDARD_PROMOTION_KINDS = ["q", "r", "b", "n"]

const DO_COMMENTS = true
const DO_MULTI = true

const DEFAULT_MOVE_OVERHEAD = 1000

function strippedfen(fen){
    return fen.split(" ").slice(0, 4).join(" ")
}

function stripsan(san){
    let strippedsan = san.replace(new RegExp(`[\+#]*`, "g"), "")
    return strippedsan
}

const PIECE_DIRECTION_STRINGS = ["w", "nw", "n", "ne", "e", "se", "s", "sw"]

function pieceDirectionStringToSquareDelta(pieceDirectionString){
    let squareDelta = SquareDelta(0, 0)
    if(pieceDirectionString.includes("n")) squareDelta.y = -1
    if(pieceDirectionString.includes("s")) squareDelta.y = 1
    if(pieceDirectionString.includes("e")) squareDelta.x = 1
    if(pieceDirectionString.includes("w")) squareDelta.x = -1
    return squareDelta
}

class SquareDelta_{
    constructor(x, y){
        this.x = x
        this.y = y
    }

    equalto(sd){
        return ( 
            ( this.x == sd.x ) &&
            ( this.y == sd.y )
        )
    }

    inverse(){
        return SquareDelta(-this.x, -this.y)
    }

    angle(){
        let pds = this.toPieceDirectionString()
        return Math.PI / 4 * PIECE_DIRECTION_STRINGS.indexOf(pds)
    }

    toPieceDirectionString(){
        let buff = ""
        if(this.y){
            buff += this.y < 0 ? "n" : "s"
        }
        if(this.x){
            buff += this.x > 0 ? "e" : "w"
        }
        return buff
    }

    normalized(){
        if((this.x == 0) && (this.y == 0)) return null
        if((this.x * this.y) == 0){
            return SquareDelta(Math.sign(this.x), Math.sign(this.y))
        }else{
            if(Math.abs(this.x) != Math.abs(this.y)) return null
            return SquareDelta(Math.sign(this.x), Math.sign(this.y))
        }
    }
}
function SquareDelta(x, y){return new SquareDelta_(x, y)}

const NUM_SQUARES = 8
const LAST_SQUARE = NUM_SQUARES - 1
const BOARD_AREA = NUM_SQUARES * NUM_SQUARES

const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
const ANTICHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1"
const RACING_KINGS_START_FEN = "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1"
const HORDE_START_FEN = "rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1"
const THREE_CHECK_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 3+3 0 1"
const CRAZYHOUSE_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1"
const SCHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[HEhe] w KQBCDFGkqbcdfg - 0 1"
const EIGHTPIECE_START_FEN = "jlsesqkbnr/pppppppp/8/8/8/8/PPPPPPPP/JLneSQKBNR w KQkq - 0 1 -"

const WHITE = true
const BLACK = false

function ROOK_DIRECTIONS(){return [
    SquareDelta(1,0),
    SquareDelta(-1,0),
    SquareDelta(0,1),
    SquareDelta(0,-1)
]}

function BISHOP_DIRECTIONS(){return [
    SquareDelta(1,1),
    SquareDelta(-1,-1),
    SquareDelta(1,-1),
    SquareDelta(-1,1)
]}

function QUEEN_DIRECTIONS(){return [
    SquareDelta(1,0),
    SquareDelta(-1,0),
    SquareDelta(0,1),
    SquareDelta(0,-1),
    SquareDelta(1,1),
    SquareDelta(-1,-1),
    SquareDelta(1,-1),
    SquareDelta(-1,1)
]}

function KING_DIRECTIONS(){return [
    SquareDelta(1,0),
    SquareDelta(-1,0),
    SquareDelta(0,1),
    SquareDelta(0,-1),
    SquareDelta(1,1),
    SquareDelta(-1,-1),
    SquareDelta(1,-1),
    SquareDelta(-1,1)
]}

function KNIGHT_DIRECTIONS(){return [
    SquareDelta(2,1),
    SquareDelta(2,-1),
    SquareDelta(-2,1),
    SquareDelta(-2,-1),
    SquareDelta(1,2),
    SquareDelta(1,-2),
    SquareDelta(-1,2),
    SquareDelta(-1,-2)
]}

function JAILER_DIRECTIONS(){return [
    SquareDelta(1,0),
    SquareDelta(-1,0),
    SquareDelta(0,1),
    SquareDelta(0,-1)
]}

function SENTRY_DIRECTIONS(){return [
    SquareDelta(1,1),
    SquareDelta(-1,-1),
    SquareDelta(1,-1),
    SquareDelta(-1,1)
]}

function PIECE_DIRECTIONS(kind){
    if(kind == "r") return [ROOK_DIRECTIONS(), true]    
    if(kind == "b") return [BISHOP_DIRECTIONS(), true]
    if(kind == "q") return [QUEEN_DIRECTIONS(), true]
    if(kind == "k") return [KING_DIRECTIONS(), false]
    if(kind == "n") return [KNIGHT_DIRECTIONS(), false]    
    if(kind == "j") return [JAILER_DIRECTIONS(), true]    
    if(kind == "s") return [SENTRY_DIRECTIONS(), true]    
}

function getPieceDirection(piece){
    if(piece.kind == "l") return [ [ piece.direction ] , true ]
    return PIECE_DIRECTIONS(piece.kind)
}

function ADJACENT_DIRECTIONS(){
    let adjDirs = []
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if((i!=0)||(j!=0)) adjDirs.push(SquareDelta(i,j))
    return adjDirs
}

const PAWNDIRS_WHITE = {
    baserank: 6,
    promrank: 0,
    pushtwo: SquareDelta(0, -2),
    pushone: SquareDelta(0, -1),
    captures: [SquareDelta(-1, -1), SquareDelta(1, -1)]
}

const PAWNDIRS_BLACK = {
    baserank: 1,
    promrank: 7,
    pushtwo: SquareDelta(0, 2),
    pushone: SquareDelta(0, 1),
    captures: [SquareDelta(-1, 1), SquareDelta(1, 1)]
}

function PAWNDIRS(color){
    return color ? PAWNDIRS_WHITE : PAWNDIRS_BLACK
}

const VARIANT_KEYS = [    
    [ "standard", "Standard", STANDARD_START_FEN ],
    [ "chess960", "Chess960", STANDARD_START_FEN ],
    [ "crazyhouse", "Crazyhouse", CRAZYHOUSE_START_FEN ],
    [ "antichess", "Giveaway", ANTICHESS_START_FEN ],
    [ "atomic", "Atomic", STANDARD_START_FEN ],
    [ "horde", "Horde", HORDE_START_FEN ],
    [ "kingOfTheHill", "King of the Hill", STANDARD_START_FEN ],
    [ "racingKings", "Racing Kings", RACING_KINGS_START_FEN ],
    [ "threeCheck", "Three-check", THREE_CHECK_START_FEN ],
    [ "seirawan", "S-Chess", SCHESS_START_FEN ],
    [ "eightpiece", "8-Piece", EIGHTPIECE_START_FEN ],
]

const INCLUDE_LIMITS = true

function baseRank(color){
    if(color == BLACK) return 0
    return LAST_SQUARE
}

function getvariantstartfen(variant){
    let key = VARIANT_KEYS.find((value)=>value[0]==variant)
    if(key) return key[2]
    return STANDARD_START_FEN
}

class Square_{
    constructor(file, rank){
        this.file = file
        this.rank = rank
    }

    adddelta(v){
        return Square(this.file + v.x, this.rank + v.y)
    }

    equalto(sq){
        if(!sq) return false
        return ( this.file == sq.file ) && ( this.rank == sq.rank )
    }

    clone(){
        return Square(this.file, this.rank)
    }
}
function Square(file, rank){return new Square_(file, rank)}

let ALL_SQUARES = []
for(let rank=0;rank<NUM_SQUARES;rank++) for(let file=0;file<NUM_SQUARES;file++) ALL_SQUARES.push(Square(file, rank))

class Piece_{
    constructor(kind, color, direction){
        this.kind = kind
        this.color = color
        this.direction = direction
    }

    isempty(){
        return !this.kind
    }

    toString(){
        if(this.isempty()) return "-"
        let buff = (!this.color) ? this.kind: this.kind.toUpperCase()
        if(this.direction) buff += this.direction.toPieceDirectionString()
        return buff
    }

    tocolor(color){
        return Piece(this.kind, color, this.direction)
    }

    colorInverse(){
        return this.tocolor(!this.color)
    }

    inverse(){
        let colorInverse = this.colorInverse()

        if(this.kind == "l"){
            colorInverse.direction = colorInverse.direction.inverse()
        }

        return colorInverse
    }

    equalto(p){
        if(this.direction && p.direction){
            if(!this.direction.equalto(p.direction)) return false
        }else if(this.direction || p.direction) return false

        return ( 
            ( this.kind == p.kind ) &&
            ( this.color == p.color )
        )
    }

    clone(){
        return Piece(this.kind, this.color, this.direction)
    }

    letter(){
        if(!this.color) return this.kind
        return this.kind.toUpperCase()
    }
}
function Piece(kind, color, direction){return new Piece_(kind, color, direction)}
function PieceL(letter){
    if(letter == letter.toLowerCase()) return new Piece_(letter, BLACK)
    return new Piece_(letter.toLowerCase(), WHITE)
}

class Move_{
    constructor(fromsq, tosq, prompiece, epclsq, epsq, promsq){
        this.fromsq = fromsq
        this.tosq = tosq
        this.prompiece = prompiece
        this.epclsq = epclsq
        this.epsq = epsq
        this.promsq = promsq
    }

    effpromsq(){
        return this.promsq || this.tosq
    }

    roughlyequalto(move){
        return this.fromsq.equalto(move.fromsq) && this.tosq.equalto(move.tosq)
    }
}
function Move(fromsq, tosq, prompiece, epclsq, epsq, promsq){return new Move_(fromsq, tosq, prompiece, epclsq, epsq, promsq)}

const ADD_CANCEL = true

function LANCER_PROMOTION_PIECES(color, addCancel){
    let lpp = QUEEN_DIRECTIONS().map(qd => Piece("l", color, qd))
    if(addCancel) lpp = lpp.concat([
        Piece("x", BLACK, SquareDelta(0, 0))
    ])
    return lpp
}

const FIFTY_MOVE_RULE_LIMIT     = 100

class ChessBoard_{
    constructor(props){        
        this.props = props || {}

        this.variant = this.props.variant || DEFAULT_VARIANT
        
        this.rep = Array(BOARD_AREA).fill(null)    

        this.stack = []

        this.setfromfen()
    }

    PROMOTION_PIECES(color, addCancel){
        let basicPieces = [
            Piece("q", color, SquareDelta(0, 0)),
            Piece("r", color, SquareDelta(1, 0)),
            Piece("b", color, SquareDelta(0, 1)),
            Piece("n", color, SquareDelta(1, 1)),
        ]

        if(this.IS_SCHESS()){
            basicPieces = basicPieces.concat([
                Piece("e", color, SquareDelta(0, 2)),
                Piece("h", color, SquareDelta(1, 2)),                
            ])
            if(addCancel){
                basicPieces = basicPieces.concat([                  
                    Piece("x", BLACK, SquareDelta(0, 3)),
                ])
            }
        }else if(this.IS_EIGHTPIECE()){
            basicPieces = LANCER_PROMOTION_PIECES(color, addCancel).concat([
                Piece("j", color, SquareDelta(-1, 2)),
                Piece("q", color, SquareDelta(0, 2)),
                Piece("r", color, SquareDelta(1, 2)),
                Piece("s", color, SquareDelta(-1, 3)),
                Piece("b", color, SquareDelta(0, 3)),
                Piece("n", color, SquareDelta(1, 3)),
            ])
        }else{
            if(addCancel) basicPieces = basicPieces.concat([
                Piece("x", BLACK, SquareDelta(0, 2)),
            ])
        }

        let maxy = basicPieces.map(p => p.direction).reduce((prev, curr) => curr.rank > prev ? curr.rank : prev, 0)

        if(!color){
            basicPieces.forEach(p => p.direction.y = maxy - p.direction.y)
        }

        return basicPieces
    }

    status(){
        let lms = this.legalmovesforallpieces()

        if(lms.length){
            if(this.halfmoveclock >= FIFTY_MOVE_RULE_LIMIT){
                return {
                    terminated: true,
                    result: 0.5,
                    resultReason: "fifty move rule"
                }
            }
            return {
                terminated: false,
                result: null,
                resultReason: "in progress"
            }
        }

        if(this.iskingincheck(this.turn)){
            return {
                terminated: true,
                result: ( this.turn == WHITE ) ? 0 : 1,
                resultReason: "mate"
            }
        }

        return {
            terminated: true,
            result: 0.5,
            resultReason: "stalemate"
        }
    }

    IS_ATOMIC(){
        return this.variant == "atomic"
    }

    IS_ANTICHESS(){
        return this.variant == "antichess"
    }

    IS_SCHESS(){
        return this.variant == "seirawan"
    }

    IS_EIGHTPIECE(){
        return this.variant == "eightpiece"
    }

    pieceStore(){
        if(!this.piecestorefen) return []
        return this.piecestorefen.split("").map(letter => PieceL(letter))
    }

    squareStore(){
        if(!this.castlefen == "-") return []

        return this.castlefen.split("").map(letter => {
            switch(letter){
                case "K":                    
                    return this.rookorigsq("k", WHITE)
                case "Q":
                    return this.rookorigsq("q", WHITE)
                case "k":
                    return this.rookorigsq("k", BLACK)
                case "q":
                    return this.rookorigsq("q", BLACK)
                default:
                    let lower = letter.toLowerCase()
                    let color = letter == lower ? BLACK : WHITE
                    let file = lower.charCodeAt(0) - "a".charCodeAt(0)
                    let rank = baseRank(color)                
                    return Square(file, rank)
            }            
        })
    }

    pieceStoreColor(color){
        return this.pieceStore().filter(p => p.color == color)
    }

    adjacentsquares(sq){
        return ADJACENT_DIRECTIONS().map((dir)=>sq.adddelta(dir)).filter((sq)=>this.squareok(sq))
    }

    jailerAdjacentSquares(sq){
        return JAILER_DIRECTIONS().map(dir => sq.adddelta(dir)).filter(sq => this.squareok(sq))
    }

    isSquareJailedBy(sq, color){
        return this.jailerAdjacentSquares(sq).filter(testsq => this.pieceatsquare(testsq).equalto(Piece("j", color))).length > 0
    }

    kingsadjacent(){
        let wkw = this.whereisking(WHITE)
        if(!wkw) return false
        let wkb = this.whereisking(BLACK)
        if(!wkb) return false
        return this.adjacentsquares(wkw).find((sq)=>sq.equalto(wkb))
    }

    algebtosquare(algeb){                
        if(algeb == "-") return null
        let file = algeb.charCodeAt(0) - "a".charCodeAt(0)
        let rank = NUM_SQUARES - 1 - ( algeb.charCodeAt(1) - "1".charCodeAt(0) )
        return Square(file, rank)
    }

    algebtomovesimple(algeb){
        if(typeof algeb == "undefined") return null
        if(algeb === null) return null
        if((algeb == "-") || (algeb == "")) return null

        return Move(
            this.algebtosquare(algeb.substring(0,2)),
            this.algebtosquare(algeb.substring(2,4))
        )
    }

    get turnVerbal(){
        return this.turn ? "white" : "black"
    }

    get reverseTurnVerbal(){
        return this.turn ? "black" : "white"
    }

    setfromfen(fenopt, variantopt){        
        this.variant = variantopt || this.variant
        this.fen = fenopt || getvariantstartfen(this.variant)

        this.fenparts = this.fen.split(" ")
        this.rawfen = this.fenparts[0]
        this.rankfens = this.rawfen.split("/")
        this.turnfen = this.fenparts[1]           
        this.castlefen = this.fenparts[2]
        this.epfen = this.fenparts[3]  
        this.halfmovefen = this.fenparts[4]          
        this.fullmovefen = this.fenparts[5]          
        this.disablefen = null
        if(this.fenparts.length > 6) this.disablefen = this.fenparts[6]

        // schess piece store
        let rawfenparts = this.rawfen.split(/\[|\]/)
        this.piecestorefen = rawfenparts.length > 1 ? rawfenparts[1] : ""        

        this.turn = this.turnfen == "w" ? WHITE : BLACK

        this.epsq = this.algebtosquare(this.epfen)

        this.halfmoveclock = parseInt(this.halfmovefen)
        this.fullmovenumber = parseInt(this.fullmovefen)

        for(let i=0;i<BOARD_AREA;i++) this.rep[i] = Piece()

        let i = 0        
        for(let rankfen of this.rankfens){            
            let rfa = Array.from(rankfen)
            let rfai = 0
            do{
                let c = rfa[rfai++]
                if((c>='0')&&(c<='9')){
                    let repcnt = c.charCodeAt(0) - '0'.charCodeAt(0)
                    for(let j=0;j<repcnt;j++){
                        this.rep[i++] = Piece()
                    }
                }else{
                    let kind = c
                    let color = BLACK
                    if((c>='A')&&(c<="Z")){
                        kind = c.toLowerCase()
                        color = WHITE
                    }   
                    
                    if(kind == "l"){
                        // lancer
                        let buff = rfa[rfai++]                                                
                        if(["n", "s"].includes(buff)){
                            let test = rfa[rfai]
                            if(["e", "w"].includes(test)){
                                buff += test
                                rfai++
                            }
                        }                        
                        this.rep[i++] = Piece(kind, color, pieceDirectionStringToSquareDelta(buff))
                    }else{
                        this.rep[i++] = Piece(kind, color)
                    }                    
                }
            }while(rfai < rfa.length)
        }                

        return this
    }

    pieceatsquare(sq){
        return this.rep[sq.file + sq.rank * NUM_SQUARES]
    }

    toString(){
        let buff = ""
        for(let sq of ALL_SQUARES){
            buff += this.pieceatsquare(sq).toString()
            if(sq.file == LAST_SQUARE) buff += "\n"
        }
        return buff
    }

    squaretoalgeb(sq){return `${String.fromCharCode(sq.file + 'a'.charCodeAt(0))}${String.fromCharCode(NUM_SQUARES - 1 - sq.rank + '1'.charCodeAt(0))}`}

    movetoalgeb(move, nochess960){
        if(!move) return "-"

        if(this.IS_SCHESS()){            
            if(move.castling){                
                let from = move.fromsq
                let to = move.delrooksq
                if(move.placeCastlingPiece){
                    if(move.placeCastlingSquare.equalto(to)){
                        [from, to] = [to, from]
                    }                    
                }
                return `${this.squaretoalgeb(from)}${this.squaretoalgeb(to)}${move.placeCastlingPiece ? move.placeCastlingPiece.kind : ''}`
            }
            if(move.placePiece){
                return `${this.squaretoalgeb(move.fromsq)}${this.squaretoalgeb(move.tosq)}${move.placePiece.kind}`
            }
        }

        let fromp = this.pieceatsquare(move.fromsq)
        let top = this.pieceatsquare(move.tosq)

        let prom = move.prompiece ? move.prompiece.kind : ""

        if((fromp.kind == "l") || ((fromp.kind == "s")) && (top.kind == "l")){
            if(move.prompiece){
                prom += move.prompiece.direction.toPieceDirectionString()
            }else{
                // lancer prompiece may be missing when lancer is pushed
                prom += fromp.direction.toPieceDirectionString()
            }            
        }

        if(move.promsq) prom += "@" + this.squaretoalgeb(move.promsq)

        if((!nochess960) && move.castling){
            return `${this.squaretoalgeb(move.fromsq)}${this.squaretoalgeb(move.delrooksq)}`
        }

        return `${this.squaretoalgeb(move.fromsq)}${this.squaretoalgeb(move.tosq)}${prom}`
    }

    squaretorepindex(sq){
        return sq.file + sq.rank * NUM_SQUARES
    }

    setpieaceatsquare(sq, p){
        this.rep[this.squaretorepindex(sq)] = p
    }

    squaresForPieceKind(kind, color){
        return ALL_SQUARES.filter(sq => {
            let p = this.pieceatsquare(sq)
            return (p.kind == kind) && (p.color == color)
        })
    }

    attacksonsquarebylancer(sq, color){
        let attacks = []
        for(let testsq of this.squaresForPieceKind("l", color)){
            let plms = this.pseudolegalmovesforpieceatsquare(this.pieceatsquare(testsq), testsq)
            attacks = attacks.concat(plms.filter(plm => plm.tosq.equalto(sq)))
        }
        return attacks.map(attack => Move(attack.tosq, attack.fromsq))
    }

    attacksonsquarebysentry(sq, color){
        let attacks = []
        for(let testsq of this.squaresForPieceKind("s", color)){
            let plms = this.pseudolegalmovesforpieceatsquare(this.pieceatsquare(testsq), testsq)            
            attacks = attacks.concat(plms.filter(plm => plm.promsq))
                .filter(plm => plm.promsq.equalto(sq))
        }        
        return attacks.map(attack => Move(attack.promsq, attack.fromsq))
    }

    attacksonsquarebypieceInner(sq, p){                        
        if(p.kind == "l") return this.attacksonsquarebylancer(sq, p.color)

        if(p.kind == "s") return this.attacksonsquarebysentry(sq, p.color)

        let plms = this.pseudolegalmovesforpieceatsquare(p.inverse(), sq)        

        return plms.filter(move => this.pieceatsquare(move.tosq).equalto(p))
    }

    attacksonsquarebypiece(sq, p){
        let attacks = this.attacksonsquarebypieceInner(sq, p)

        return attacks.filter(attack => !this.isSquareJailedBy(attack.tosq, !p.color))
    }

    issquareattackedbycolor(sq, color){
        let pieceLetters = ['q', 'r', 'b', 'n', 'k']
        if(this.IS_SCHESS()) pieceLetters = pieceLetters.concat(["e", "h"])
        if(this.IS_EIGHTPIECE()) pieceLetters = pieceLetters.concat(["s"])
        for(let pl of pieceLetters){
            if(this.attacksonsquarebypiece(sq, Piece(pl, color)).length > 0) return true
        }
        if(this.IS_EIGHTPIECE()){
            for(let lancer of LANCER_PROMOTION_PIECES(color)){
                if(this.attacksonsquarebypiece(sq, lancer).length > 0) return true
            }
        }
        let pd = PAWNDIRS(!color)
        for(let capt of pd.captures){
            let testsq = sq.adddelta(capt)
            if(this.squareok(testsq)){
                if(this.pieceatsquare(testsq).equalto(Piece('p', color))) return true
            }
        }
        return false
    }

    whereisking(color){
        let searchking = Piece('k', color)
        for(let sq of ALL_SQUARES){            
            if(this.pieceatsquare(sq).equalto(searchking)) return sq
        }
        return null
    }

    iskingincheckAfterMove(move, color){
        this.push(move)
        let ischeck = this.iskingincheck(color)
        this.pop()
        return ischeck
    }

    iskingincheck(color){
        let wk = this.whereisking(color)        
        if(this.IS_EIGHTPIECE()){
            if(!wk) return true
        }
        if(this.IS_ATOMIC()){
            if(!wk) return true
            let wkopp = this.whereisking(!color)        
            if(!wkopp) return false
            if(this.kingsadjacent()) return false
        }else{
            if(!wk) return false
        }        
        return this.issquareattackedbycolor(wk, !color)
    }

    deletecastlingrights(deleterightsstr, color){
        if(this.castlefen == "-") return
        if(color) deleterightsstr = deleterightsstr.toUpperCase()
        let deleterights = deleterightsstr.split("")        
        let rights = this.castlefen.split("")
        for(let deleteright of deleterights) rights = rights.filter((right)=>right != deleteright)
        this.castlefen = rights.length > 0 ? rights.join("") : "-"
    }

    rookorigsq(side, color){
        if(color){
            if(side == "k") return Square(7, 7)
            else return Square(0, 7)
        }else{
            if(side == "k") return Square(7, 0)
            else return Square(0, 0)
        }
    }

    rookorigpiece(side, color){
        if(this.IS_EIGHTPIECE()){
            if(side == "q") return Piece("j", color)
        }
        return Piece("r", color)
    }

    castletargetsq(side, color){
        if(color){
            if(side == "k") return Square(6, 7)
            else return Square(2, 7)
        }else{
            if(side == "k") return Square(6, 0)
            else return Square(2, 0)
        }
    }

    rooktargetsq(side, color){
        if(color){
            if(side == "k") return Square(5, 7)
            else return Square(3, 7)
        }else{
            if(side == "k") return Square(5, 0)
            else return Square(3, 0)
        }
    }

    squaresbetween(sq1orig, sq2orig, includelimits){        
        let sq1 = sq1orig.clone()
        let sq2 = sq2orig.clone()
        let rev = sq2.file < sq1.file
        if(rev){
            let temp = sq1
            sq1 = sq2
            sq2 = temp
        }
        let sqs = []
        if(includelimits) sqs.push(sq1.clone())
        let currentsq = sq1
        let ok = true
        do{
            currentsq.file++
            if(currentsq.file < sq2.file) sqs.push(currentsq.clone())
            else if(currentsq.file == sq2.file){
                if(includelimits) sqs.push(currentsq.clone())
                ok = false
            }else{
                console.log("warning, squaresbetween received equal files")
                ok = false
            }
        }while(ok)
        return sqs
    }

    cancastle(side, color){        
        if(!this.castlefen.includes(color ? side.toUpperCase() : side)) return false
        let wk = this.whereisking(color)        
        if(!wk) return false
        let ro = this.rookorigsq(side, color)                        
        let betweensqs = this.squaresbetween(wk, ro)              
        if(betweensqs.length != betweensqs.filter((sq)=>this.pieceatsquare(sq).isempty()).length) return false        
        let ct = this.castletargetsq(side, color)        
        let passingsqs = this.squaresbetween(wk, ct, INCLUDE_LIMITS)        
        for(let sq of passingsqs){
            if(this.issquareattackedbycolor(sq, !color)) return false
        }
        if(this.IS_EIGHTPIECE()){
            if(this.isSquareJailedBy(this.rookorigsq(side, color), !color)) return false
            if(this.isKingJailed(color)) return false
        }
        return true
    }

    isKingJailed(color){
        let wk = this.whereisking(color)

        if(!wk) return false

        return this.isSquareJailedBy(wk, !color)
    }

    getstate(){
        return {
            rep: this.rep.map((p)=>p.clone()),
            turn: this.turn,            
            epsq: this.epsq ? this.epsq.clone() : null,
            halfmoveclock: this.halfmoveclock,
            fullmovenumber: this.fullmovenumber,

            rawfen: this.rawfen,
            turnfen: this.turnfen,
            castlefen: this.castlefen,
            epfen: this.epfen,
            halfmovefen: this.halfmovefen,
            fullmovefen: this.fullmovefen,
            disablefen: this.disablefen,
            piecestorefen: this.piecestorefen,            

            fen: this.fen
        }
    }

    pushstate(){
        this.stack.push(this.getstate())
    }

    setstate(state){
        this.rep = state.rep
        this.turn = state.turn        
        this.epsq = state.epsq
        this.halfmoveclock = state.halfmoveclock
        this.fullmovenumber = state.fullmovenumber

        this.rawfen = state.rawfen
        this.turnfen = state.turnfen
        this.castlefen = state.castlefen
        this.epfen = state.epfen
        this.halfmovefen = state.halfmovefen
        this.fullmovefen = state.fullmovefen
        this.disablefen = state.disablefen
        this.piecestorefen = state.piecestorefen        

        this.fen = state.fen
    }

    pop(){
        this.setstate(this.stack.pop())
    }

    algebtomove(algeb){
        if(!algeb) return null
        if(algeb == "-") return null

        let lms = this.legalmovesforallpieces()

        let move = lms.find(testmove => this.movetoalgeb(testmove) == algeb)

        if(move) return move

        // try non chess960
        return lms.find(testmove => this.movetoalgeb(testmove, NON_CHESS960) == algeb)
    }

    pushalgeb(algeb){
        let move = this.algebtomove(algeb)

        if(!move) return false

        this.push(move)

        return true
    }

    removePlacePieceFromStore(p){
        let pstore = this.piecestorefen.split("")
        pstore = pstore.filter(pl => p.toString() != pl)
        this.piecestorefen = pstore.join("")
    }

    removeSquareFromStore(sq){
        let algeb = this.squaretoalgeb(sq)
        let fileLetter = algeb.substring(0, 1)

        if(sq.rank == baseRank(WHITE)){
            this.deletecastlingrights(fileLetter, WHITE)
            return
        }

        if(sq.rank == baseRank(BLACK)){
            this.deletecastlingrights(fileLetter, BLACK)
            return
        }
    }

    push(move){                
        this.pushstate()

        let fromp = this.pieceatsquare(move.fromsq)

        // set squares

        let top = this.pieceatsquare(move.tosq)        
        this.setpieaceatsquare(move.fromsq, Piece())

        if(move.placePiece){
            this.setpieaceatsquare(move.fromsq, move.placePiece)

            this.removePlacePieceFromStore(move.placePiece)            
        }

        if(move.placeMove){
            this.removeSquareFromStore(move.fromsq)
        }

        // move from piece in any case, overwrite this with normal promotion if needed
        this.setpieaceatsquare(move.tosq, fromp)

        if(move.prompiece){                                    
            this.setpieaceatsquare(move.effpromsq(), move.promsq ? move.prompiece : this.turn ? move.prompiece.tocolor(WHITE) : move.prompiece)
        }   

        if(move.promsq){
            if(fromp.kind == "s"){
                if(move.prompiece.kind != "p"){
                    this.disablefen = this.movetoalgeb(Move(move.promsq, move.tosq))
                }                
            }
        }else{
            if(this.IS_EIGHTPIECE()){
                this.disablefen = "-"
            }            
        }

        if(move.epclsq){            
            this.setpieaceatsquare(move.epclsq, Piece())
        }

        if(move.castling){
            this.setpieaceatsquare(move.delrooksq, Piece())
            this.setpieaceatsquare(move.putrooksq, move.putrookpiece)
        }

        // set castling rights

        if(move.castling) this.deletecastlingrights("kq", this.turn)

        if(this.IS_SCHESS()){
            if(fromp.kind == "k"){            
                for(let side of ["k", "q"]){
                    if(this.cancastle(side, this.turn)){
                        let letter = side
                        let newLetter = this.squaretoalgeb(this.rookorigsq(side, this.turn))[0]
                        if(this.turn == WHITE){
                            letter = letter.toUpperCase()
                            newLetter = newLetter.toUpperCase()
                        }
                        this.castlefen = this.castlefen.replace(letter, newLetter)
                    }
                }
            }
        }

        for(let side of ["k", "q"]){
            let rosq = this.rookorigsq(side, this.turn)
            let rop = this.pieceatsquare(rosq)
            if(!rop.equalto(this.rookorigpiece(side, this.turn))) this.deletecastlingrights(side, this.turn)
        }

        if(fromp.kind == "k"){            
            this.deletecastlingrights("kq", this.turn)
        }

        // calculate new state

        this.turn = !this.turn        
        this.epsq = null
        if(move.epsq) this.epsq = move.epsq

        this.turnfen = this.turn ? "w" : "b"
        if(this.turn){
            this.fullmovenumber++
            this.fullmovefen = `${this.fullmovenumber}`
        }
        let capture = false
        if(!top.isempty()) capture = true
        if(move.epclsq) capture = true
        let pawnmove = fromp.kind == "p"
        if(capture || pawnmove){
            this.halfmoveclock = 0
        }else{
            this.halfmoveclock++
        }

        // atomic explosions
        if(this.IS_ATOMIC()){
            if(capture){                
                this.setpieaceatsquare(move.tosq, Piece())
                for(let sq of this.adjacentsquares(move.tosq)){                                        
                    let ispawn = this.pieceatsquare(sq).kind == "p"                    
                    if(!ispawn){                                 
                        this.setpieaceatsquare(sq, Piece())
                    }
                }
            }
        }

        // place castling
        if(move.castling && this.IS_SCHESS()){            
            if(move.placeCastlingPiece){
                this.setpieaceatsquare(move.placeCastlingSquare, move.placeCastlingPiece)

                this.removePlacePieceFromStore(move.placeCastlingPiece)
            }
        }

        this.halfmovefen = `${this.halfmoveclock}`
        this.epfen = this.epsq ? this.squaretoalgeb(this.epsq) : "-"

        let rawfenbuff = ""
        let cumul = 0

        for(let sq of ALL_SQUARES){
            let p = this.pieceatsquare(sq)
            if(p.isempty()){
                cumul++
            }else{
                if(cumul > 0){
                    rawfenbuff += `${cumul}`
                    cumul = 0
                }
                rawfenbuff += p.toString()
            }
            if( (cumul > 0) && ( sq.file == LAST_SQUARE ) ){
                rawfenbuff += `${cumul}`
                cumul = 0
            }
            if( (sq.file == LAST_SQUARE) && (sq.rank < LAST_SQUARE) ){
                rawfenbuff += "/"
            }
        }

        this.rawfen = rawfenbuff

        let psb = this.IS_SCHESS() ? `[${this.piecestorefen}]` : ""

        this.fen = this.rawfen + psb + " " + this.turnfen + " " + this.castlefen + " " + this.epfen + " " + this.halfmovefen + " " + this.fullmovefen

        if(this.disablefen) this.fen += " " + this.disablefen
    }

    reportRawFen(){
        let rawfenbuff = ""
        let cumul = 0

        for(let sq of ALL_SQUARES){
            let p = this.pieceatsquare(sq)
            if(p.isempty()){
                cumul++
            }else{
                if(cumul > 0){
                    rawfenbuff += `${cumul}`
                    cumul = 0
                }
                rawfenbuff += p.toString()
            }
            if( (cumul > 0) && ( sq.file == LAST_SQUARE ) ){
                rawfenbuff += `${cumul}`
                cumul = 0
            }
            if( (sq.file == LAST_SQUARE) && (sq.rank < LAST_SQUARE) ){
                rawfenbuff += "/"
            }
        }

        return rawfenbuff
    }

    squareok(sq){
        return ( sq.file >= 0 ) && ( sq.rank >= 0 ) && ( sq.file < NUM_SQUARES ) && ( sq.rank < NUM_SQUARES)
    }

    assertMaxPlmsGenDepth(depth){        
        if(depth <= MAX_PLMS_GEN_DEPTH) return true
        console.log(`max plms gen depth ${MAX_PLMS_GEN_DEPTH} exceeded at depth ${depth}`)
        return false
    }

    pseudolegalmovesforpieceatsquare(p, sq, depthOpt){                        
        let depth = depthOpt || 0
        if(!this.assertMaxPlmsGenDepth(depth)) return []

        let origPiece = this.pieceatsquare(sq)

        if(this.IS_EIGHTPIECE()){
            if(p.kind == "s"){
                // remove sentry for move generation                
                this.setpieaceatsquare(sq, Piece())
            }
        }

        let acc = this.pseudolegalmovesforpieceatsquareinner(p, sq, depth)

        let pstore = this.pieceStoreColor(p.color)
        
        if(this.IS_SCHESS()){
            if(sq.rank == baseRank(p.color)){
                if(this.squareStore().find(tsq => tsq.equalto(sq))) for(let psp of pstore){
                    acc = acc.concat(this.pseudolegalmovesforpieceatsquareinner(p, sq, depth).map(psm => {                        
                        psm.placePiece = psp
                        return psm
                    }))
                }
                acc = acc.map(psm => {
                    psm.placeMove = true
                    return psm
                })
            }            
        }

        // restore original piece in any case
        this.setpieaceatsquare(sq, origPiece)

        return acc
    }

    pseudolegalmovesforpieceatsquareinner(p, sq, depthOpt){
        let depth = depthOpt || 0
        if(!this.assertMaxPlmsGenDepth(depth)) return []

        if(p.kind == "e"){
            let acc = this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("r", p.color), sq, depth)
            acc = acc.concat(this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("n", p.color), sq, depth))
            return acc
        }

        if(p.kind == "h"){
            let acc = this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("b", p.color), sq, depth)
            acc = acc.concat(this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("n", p.color), sq, depth))
            return acc
        }

        return this.pseudolegalmovesforpieceatsquareinnerpartial(p, sq, depth)
    }

    pushLancerMoves(plms, color, move){
        for(let ds of PIECE_DIRECTION_STRINGS){
            plms.push(Move(move.fromsq, move.tosq, Piece("l", color, pieceDirectionStringToSquareDelta(ds))))
        }
    }

    pseudolegalmovesforpieceatsquareinnerpartial(p, sq, depthOpt){                        
        let depth = depthOpt || 0
        if(!this.assertMaxPlmsGenDepth(depth)) return []

        let dirobj = getPieceDirection(p)        
        let plms = []                

        let sentryCaptureAllowed = true
        let pushTwoAllowed = true
        let moveJailedProhibited = true

        if(this.IS_EIGHTPIECE() && (depth > 0)){
            // impose restrictions on sentry push
            sentryCaptureAllowed = false            
            pushTwoAllowed = false
            // allow sentry to push jailed piece
            // TODO: clarify this rule
            moveJailedProhibited = false
        }

        if((p.kind == "k") && this.isSquareJailedBy(sq, !p.color)){
            // jailed king can pass
            plms.push(Move(sq, sq.clone()))
        }

        if(this.isSquareJailedBy(sq, !p.color) && moveJailedProhibited) return plms

        if(dirobj){
            for(let dir of dirobj[0]){                
                var ok
                var currentsq = sq                
                do{                    
                    currentsq = currentsq.adddelta(dir)                    
                    ok = this.squareok(currentsq)                    
                    if(ok){
                        let tp = this.pieceatsquare(currentsq)                                                
                        if(p.kind == "l"){
                            if(tp.isempty()){                            
                                this.pushLancerMoves(plms, p.color, Move(sq, currentsq))
                            }else if(tp.color != p.color){
                                this.pushLancerMoves(plms, p.color, Move(sq, currentsq))
                                ok = false
                            }else{
                                // lancer can jump over own piece, but not capture it
                            }
                        }else{
                            if(tp.isempty()){                            
                                plms.push(Move(sq, currentsq))
                            }else if(tp.color != p.color){
                                if(p.kind == "s"){
                                    // sentry push                                    
                                    if(sentryCaptureAllowed){
                                        let pushedPiece = this.pieceatsquare(currentsq)
                                        let testPiece = pushedPiece.colorInverse()
                                        let tplms = this.pseudolegalmovesforpieceatsquare(testPiece, currentsq, depth + 1)                                        
                                        let sentryPushSquares = []
                                        let usedSquares = []
                                        tplms.forEach(tplm => {
                                            // make sure only one move is added per target square
                                            if(!usedSquares.find(usq => usq.equalto(tplm.tosq))){                                                
                                                let testMove = Move(sq, currentsq, pushedPiece, null, null, tplm.tosq)
                                                sentryPushSquares.push(tplm.tosq)
                                                plms.push(testMove)              
                                                usedSquares.push(tplm.tosq)                              
                                            }                                            
                                        })
                                        if(pushedPiece.kind == "l"){
                                            // nudge lancer
                                            let emptyAdjacentSquares = this.adjacentsquares(currentsq)
                                                .filter(testsq => this.pieceatsquare(testsq).isempty())
                                            for(let eas of emptyAdjacentSquares){
                                                let lancerNudgeDirs = [
                                                    SquareDelta(eas.file - currentsq.file, eas.rank - currentsq.rank)
                                                ]
                                                for(let dir of lancerNudgeDirs){
                                                    let nudgeMove = Move(sq, currentsq, Piece("l", pushedPiece.color, dir), null, null, eas)
                                                    nudgeMove.nudge = true                                                    
                                                    if(!sentryPushSquares.find(sps => sps.equalto(nudgeMove.promsq))){
                                                        plms.push(nudgeMove)
                                                    }                                                    
                                                }
                                            }
                                        }                                        
                                    }
                                }else{
                                    if(p.kind != "j") plms.push(Move(sq, currentsq))
                                }                                
                                ok = false
                            }else{
                                ok = false
                            }
                        }                        
                    }
                }while(ok && dirobj[1])
            }
        }else if(p.kind == "p"){
            let pdirobj = PAWNDIRS(p.color)
            let pushonesq = sq.adddelta(pdirobj.pushone)
            // sentry may push pawn to a square where push one is not possible
            let pushoneempty = this.squareok(pushonesq) ? this.pieceatsquare(pushonesq).isempty() : false
            if(pushoneempty){
                if(pushonesq.rank == pdirobj.promrank){                                        
                    for(let pp of this.PROMOTION_PIECES(p.color)){
                        if(pp.kind != "l") pp.direction = null
                        plms.push(Move(sq, pushonesq, pp))    
                    }
                }else{
                    plms.push(Move(sq, pushonesq))
                }                
            }
            if(sq.rank == pdirobj.baserank){
                if(pushoneempty){
                    let pushtwosq = sq.adddelta(pdirobj.pushtwo)
                    if(this.pieceatsquare(pushtwosq).isempty() && pushTwoAllowed){                        
                        // push two
                        let setepsq = null
                        for(let ocsqdelta of pdirobj.captures){
                            let ocsq = pushonesq.adddelta(ocsqdelta)
                            if(this.squareok(ocsq)){
                                if(this.pieceatsquare(ocsq).equalto(Piece('p', !p.color))){                                    
                                    setepsq = pushonesq
                                }
                            }
                        }
                        plms.push(Move(sq, pushtwosq, null, null, setepsq))
                    }
                }
            }            
            for(let captdir of pdirobj.captures){
                let captsq = sq.adddelta(captdir)
                if(this.squareok(captsq)){
                    let captp = this.pieceatsquare(captsq)
                    if(!captp.isempty() && captp.color != p.color){
                        if(captsq.rank == pdirobj.promrank){
                            for(let pp of this.PROMOTION_PIECES(p.color)){
                                if(pp.kind != "l") pp.direction = null
                                plms.push(Move(sq, captsq, pp))    
                            }
                        }else{
                            plms.push(Move(sq, captsq))
                        }                
                    }                    
                    if(captp.isempty() && captsq.equalto(this.epsq)){                        
                        let epmove = Move(sq, captsq, null, captsq.adddelta(SquareDelta(0, -pdirobj.pushone.y)))                        
                        plms.push(epmove)
                    }
                }                
            }
        }

        if(this.IS_EIGHTPIECE()){
            let disabledMove = this.algebtomovesimple(this.disablefen)

            if(disabledMove){
                plms = plms.filter(plm => !plm.roughlyequalto(disabledMove))
                
                if( (p.kind == "l") && (sq.equalto(disabledMove.fromsq)) ){
                    // nudged lancer has special moves
                    let ndirs = QUEEN_DIRECTIONS().filter(qd => !qd.equalto(p.direction))
                    for(let dir of ndirs){
                        let nok = true
                        let ncurrentsq = sq
                        while(nok){
                            ncurrentsq = ncurrentsq.adddelta(dir)
                            if(this.squareok(ncurrentsq)){
                                let np = this.pieceatsquare(ncurrentsq)
                                if(np.isempty()){
                                    let nmove = Move(sq, ncurrentsq, Piece("l", p.color, dir))
                                    nmove.keepDirection = true
                                    plms.push(nmove)
                                }else{                                    
                                    if(np.color != p.color){
                                        let nmove = Move(sq, ncurrentsq, Piece("l", p.color, dir))
                                        nmove.keepDirection = true
                                        plms.push(nmove)
                                        nok = false
                                    }                                    
                                }
                            }else{
                                nok = false
                            }
                        }
                    }
                }

                // disallow moving back towards sentry
                plms = plms.filter(plm => {
                    // knight and king are already taken care of, as they are not sliding pieces
                    if((p.kind != "n") && (p.kind != "k")){                        
                        let normDir = SquareDelta(
                            disabledMove.tosq.file - disabledMove.fromsq.file,
                            disabledMove.tosq.rank - disabledMove.fromsq.rank
                        ).normalized()
                        if(normDir){
                            let testcurrentsq = plm.fromsq.adddelta(normDir)
                            while(this.squareok(testcurrentsq)){
                                if(plm.tosq.equalto(testcurrentsq)) return false
                                testcurrentsq = testcurrentsq.adddelta(normDir)
                            }
                        }
                    }
                    return true
                })
            }
        }

        return plms
    }

    pseudolegalmovesforallpieces(){
        let plms = []
        for(let sq of ALL_SQUARES){
            let p = this.pieceatsquare(sq)
            if(!p.isempty() && (p.color == this.turn)){                
                plms = plms.concat(this.pseudolegalmovesforpieceatsquare(p, sq))
            }
        }
        return plms
    }

    movecheckstatus(move){        
        this.push(move)
        let status = {
            meincheck: this.iskingincheck(!this.turn),
            oppincheck: this.iskingincheck(this.turn)
        }
        this.pop()
        return status
    }

    createCastlingMove(side){
        let move = Move(this.whereisking(this.turn), this.castletargetsq(side, this.turn))
        move.castling = true        
        move.san = side == "k" ? "O-O" : "O-O-O"
        move.delrooksq = this.rookorigsq(side, this.turn)
        move.putrooksq = this.rooktargetsq(side, this.turn)
        move.putrookpiece = this.rookorigpiece(side, this.turn)
        move.passingSquares = this.squaresbetween(move.fromsq, move.delrooksq, INCLUDE_LIMITS)        
        return move
    }

    legalmovesforallpieces(){
        let lms = []
        for(let move of this.pseudolegalmovesforallpieces()){
            let mchst = this.movecheckstatus(move)            
            if(!mchst.meincheck){
                move.oppincheck = mchst.oppincheck
                lms.push(move)
            }
        }
        for(let side of ["k", "q"])
        if(this.cancastle(side, this.turn)){
            let move = this.createCastlingMove(side)
            if(!this.iskingincheckAfterMove(move, this.turn)){
                lms.push(move)
                let pstore = this.pieceStoreColor(this.turn)
                if(pstore.length){
                    if(this.IS_SCHESS()){
                        for(let psp of pstore){
                            let moveK = this.createCastlingMove(side)
                            moveK.placeCastlingPiece = psp
                            moveK.placeCastlingSquare = move.fromsq
                            moveK.san += "/" + psp.kind.toUpperCase() + this.squaretoalgeb(moveK.placeCastlingSquare)
                            lms.push(moveK)
                            let moveR = this.createCastlingMove(side)
                            moveR.placeCastlingPiece = psp
                            moveR.placeCastlingSquare = this.rookorigsq(side, this.turn)
                            moveR.san += "/" + psp.kind.toUpperCase() + this.squaretoalgeb(moveR.placeCastlingSquare)
                            lms.push(moveR)
                        }
                    }
                }
            }
        }        
        return lms
    }

    ismovecapture(move){
        if(move.epclsq) return true
        let top = this.pieceatsquare(move.tosq)
        return(!top.isempty())        
    }

    santomove(san){
        if(typeof san == "undefined") return null
        if(san === null) return null
        let lms = this.legalmovesforallpieces()
        return lms.find((move)=>stripsan(this.movetosan(move)) == stripsan(san))
    }

    movetosan(move){        
        let check = move.oppincheck ? "+" : ""        
        if(move.oppincheck){            
            this.push(move)
            if(this.legalmovesforallpieces().length == 0) check = "#"
            this.pop()
        }

        if(move.castling) return move.san + check

        let fromp = this.pieceatsquare(move.fromsq)        
        let capt = this.ismovecapture(move)
        let fromalgeb = this.squaretoalgeb(move.fromsq)
        let toalgeb = this.squaretoalgeb(move.tosq)
        let prom = ""
        if(move.prompiece){
            prom = "=" + move.prompiece.kind.toUpperCase()

            if(move.prompiece.kind == "l") prom += move.prompiece.direction.toPieceDirectionString()

            if(move.promsq) prom += "@" + this.squaretoalgeb(move.promsq)
        }
        if(fromp.kind == "l"){
            prom = move.prompiece.direction.toPieceDirectionString()
        }
        let place = move.placePiece ? "/" + move.placePiece.kind.toUpperCase() : ""

        if(fromp.kind == "p"){
            return capt ? fromalgeb[0] + "x" + toalgeb + place + prom + check : toalgeb + place + prom + check
        }

        let qualifier = ""                
        let attacks = this.attacksonsquarebypiece(move.tosq, fromp)        
        if(fromp.kind == "l"){
            attacks = []
            for(let lancer of LANCER_PROMOTION_PIECES(fromp.color)){
                let lancerattacks = this.attacksonsquarebypiece(move.tosq, lancer)                                
                for(let lancerattack of lancerattacks){                    
                    if(!attacks.find(attack => attack.tosq.equalto(lancerattack.tosq))) attacks.push(lancerattack)
                }                
            }
        }
        let files = []
        let ranks = []
        let samefiles = false
        let sameranks = false        
        for(let attack of attacks){                        
            if(files.includes(attack.tosq.file)) samefiles = true
            else files.push(attack.tosq.file)
            if(ranks.includes(attack.tosq.rank)) sameranks = true
            else ranks.push(attack.tosq.rank)            
        }
        if(attacks.length > 1){
            if(sameranks && samefiles) qualifier = fromalgeb
            else if(samefiles) qualifier = fromalgeb[1]
            else qualifier = fromalgeb[0]
        }        
        let letter = fromp.kind.toUpperCase()        
        return capt ? letter + qualifier + "x" + toalgeb + prom + check : letter + qualifier + toalgeb + place + prom + check
    }

    squarefromalgeb(algeb){        
        let file = algeb.charCodeAt(0) - "a".charCodeAt(0)
        let rank = NUM_SQUARES - 1 - ( algeb.charCodeAt(1) - "1".charCodeAt(0) )
        return Square(file, rank)
    }

    movefromalgeb(algeb){
        let move = new Move(this.squarefromalgeb(algeb.slice(0,2)), this.squarefromalgeb(algeb.slice(2,4)))

        if(algeb.includes("@")){            
            if(this.IS_SCHESS()){                
                let sq = this.squarefromalgeb(algeb.slice(2,4))
                let p = new Piece(algeb.slice(0,1).toLowerCase(), this.turnfen == "w")
                return new Move(sq, sq, p)    
            }            

            if(this.IS_EIGHTPIECE()){
                let sq = this.squarefromalgeb(algeb.match(/@(.*)/)[1])
                move.promsq = sq
            }
        }        
        return move
    }
}
function ChessBoard(props){return new ChessBoard_(props)}

function parseDrawing(comment){
    if(comment.match(/:/)) return null

    let drawing = {
        kind: "circle",
        color: "green",
        thickness: 5,
        opacity: 9,
        squares: []
    }   

    let sqstr = null 

    if(comment.includes("@")){
        let parts = comment.split("@")
        comment = parts[0]
        sqstr = parts[1]
    }

    let ok

    do{
        ok = false

        let m = comment.match(/^([lwxz])(.*)/)    

        if(m){
            drawing.kind = {l: "circle", w: "arrow", x: "square", z: "image"}[m[1]]
            comment = m[2]
            ok = true
        }

        m = comment.match(/^([rnuy])(.*)/)
        if(m){
            drawing.color = {r: "red", n: "green", u: "blue", y: "yellow"}[m[1]]
            comment = m[2]
            ok = true
        }
        m = comment.match(/^t([0-9])(.*)/)
        if(m){
            drawing.thickness = parseInt(m[1])
            comment = m[2]
            ok = true
        }
        m = comment.match(/^o([0-9])(.*)/)
        if(m){
            drawing.opacity = parseInt(m[1])
            comment = m[2]
            ok = true
        }
    }while(ok)

    ok = true

    if(sqstr) comment = sqstr

    if(drawing.kind == "image"){
        m = comment.match(/^([^\s#]*)(.*)/)
        drawing.name = m[1]
        return drawing
    }

    do{        
        m = comment.match(/^([a-z][0-9])(.*)/)
        if(m){            
            drawing.squares.push(m[1])
            comment = m[2]
        }else{
            ok = false
        }
    }while(ok)

    return drawing
}

function parseDrawings(comment){
    let drawings = []

    let ok = true

    do{
        let m = comment.match(/([^#]*)#([^#\s]*)(.*)/)
        if(m){
            comment = m[1] + m[3]
            let pd = parseDrawing(m[2])
            if(pd) drawings.push(pd)
        }else{
            ok = false
        }
    }while(ok)

    return drawings
}

function parseProps(comment){
    let props = {}

    let ok = true

    do{
        let m = comment.match(/([^#]*)#([^#:]+):([^#\s]*)(.*)/)
        if(m){
            comment = m[1] + m[4]
            props[m[2]] = m[3]
        }else{
            ok = false
        }
    }while(ok)

    return props
}

const EXCLUDE_THIS = true

const GLICKO_INITIAL_RATING         = 1500
const GLICKO_INITIAL_RD             = 250

class Glicko_{
    constructor(props){
        this.fromBlob(props)
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.rating = props.rating || GLICKO_INITIAL_RATING
        this.rd = props.rd || GLICKO_INITIAL_RD
        return this
    }

    serialize(){
        return {
            rating: this.rating,
            rd: this.rd
        }
    }
}
function Glicko(props){return new Glicko_(props)}

const ANONYMOUS_USERNAME        = "@nonymous"
const SHOW_RATING               = true

class Player_{
    constructor(props){
        this.fromBlob(props)
    }

    equalTo(player){
        return ( this.id == player.id ) && ( this.provider == player.provider )
    }

    displayName(){
        return this.username || ANONYMOUS_USERNAME
    }

    qualifiedDisplayName(showRating){
        let qdn = this.displayName()
        if(this.provider) qdn += ` ( ${this.provider} )`
        if(showRating) qdn += ` ${this.glicko.rating}`
        return qdn
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.id = props.id
        this.username = props.username
        this.provider = props.provider
        this.glicko = Glicko(props.glicko)
        this.seated = !!props.seated
        this.seatedAt = props.seatedAt || null
        this.index = props.index || 0
        this.thinkingTime = props.thinkingTime || 0
        this.startedThinkingAt = props.startedThinkingAt || null
        this.offerDraw = props.offerDraw
        return this
    }

    setIndex(index){
        this.index = index
        return this
    }

    serialize(){
        return {
            id: this.id,
            username: this.username,
            provider: this.provider,
            glicko: this.glicko.serialize(),
            seated: this.seated,
            seatedAt: this.seatedAt,
            index: this.index,
            thinkingTime: this.thinkingTime,
            startedThinkingAt: this.startedThinkingAt,
            offerDraw: this.offerDraw,
        }
    }
}
function Player(props){return new Player_(props)}

class ChatMessage_{
    constructor(props){
        this.fromBlob(props)
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.author = Player(props.author)
        this.msg = props.msg || "Chat message."
        return this
    }

    serialize(){
        return {
            author: this.author.serialize(),
            msg: this.msg
        }
    }

    asText(){
        return `${this.author.qualifiedDisplayName()} : ${this.msg}`
    }
}
function ChatMessage(props){return new ChatMessage_(props)}

class Chat_{
    constructor(props){
        this.fromBlob(props)
    }

    postMessage(chatMessamge){
        this.messages.unshift(chatMessamge)

        while(this.messages.length > this.capacity) this.messages.pop()
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.capacity = props.capacity || 100
        this.messages = (props.messages || []).map(blob => ChatMessage(blob))
        return this
    }

    serialize(){
        return {
            capacity: this.capacity,
            messages: this.messages.map(message => message.serialize())
        }
    }

    asText(){
        return this.messages.map(message => message.asText()).join("\n")
    }
}
function Chat(props){return new Chat_(props)}

const MAX_NUM_PLAYERS       = 2

class Players_{
    constructor(props){
        this.fromBlob(props)
    }

    forEach(func){
        this.players.forEach(func)
    }

    hasPlayer(player){
        return this.players.find(pl => pl.equalTo(player))
    }

    hasSeatedPlayer(player){
        let find = this.hasPlayer(player)
        if(!find) return false
        return find.seated
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.players = []
        let repo = props.players || []
        for(let i=0; i < MAX_NUM_PLAYERS; i++){
            let blob = repo.length ? repo.shift() : null
            let player = Player(blob).setIndex(i)
            this.players.push(player)
        }
        return this
    }

    getByIndex(index){
        return this.players[index]
    }

    setPlayer(player){        
        this.players[player.index] = player
    }

    getByColor(color){
        if(color) return this.getByIndex(1)
        return this.getByIndex(0)
    }

    serialize(){
        return {
            players: this.players.map(player => player.serialize())
        }
    }
}
function Players(props){return new Players_(props)}

const DEFAULT_INITIAL_CLOCK = 3
const DEFAULT_INCREMENT     = 2

class Timecontrol_{
    constructor(props){
        this.fromBlob(props)
    }

    fromBlob(propsOpt){
        let props = propsOpt || {}
        this.initial = props.initial || DEFAULT_INITIAL_CLOCK
        this.increment = props.increment || DEFAULT_INCREMENT
        return this
    }

    serialize(){
        return {
            initial: this.initial,
            increment: this.increment
        }
    }

    toString(){
        return `${this.initial} + ${this.increment}`
    }
}
function Timecontrol(props){return new Timecontrol_(props)}

class GameNode_{
    constructor(){        
    }

    getMove(){                
        if(!this.parentid) return null
        let board = ChessBoard().setfromfen(this.getparent().fen, this.parentgame.variant)
        let move = board.santomove(this.gensan)        
        return move
    }

    get strippedfen(){
        return strippedfen(this.fen)
    }

    get analysiskey(){
        return `analysis/${this.parentgame.variant}/${this.strippedfen}`
    }

    hasSan(san){
        return this.childids.find(childid => this.parentgame.gamenodes[childid].gensan == san)
    }

    get depth(){
        let depth = 0
        let current = this
        while(current.parentid){            
            current = current.getparent()
            depth++
        }
        return depth
    }

    stripCommentOfImages(){
        this.comment = this.comment.replace(/#z[^#\s]*/g, "")
    }

    stripCommentOfDelays(){
        this.comment = this.comment.replace(/#delay:[^#\s]*/g, "")
    }

    addImageToComment(name, setdelay){
        if(setdelay) this.stripCommentOfDelays()
        this.stripCommentOfImages()
        this.comment += "#z@" + name
        this.comment += "#delay:" + setdelay
    }

    fromblob(parentgame, blob){
        this.parentgame = parentgame
        this.id = blob.id
        this.genalgeb = blob.genalgeb
        this.gensan = blob.gensan
        this.fen = blob.fen
        this.childids = blob.childids || []
        this.parentid = blob.parentid || null
        this.weights = ( blob.weights || [0, 0] ).map(w => parseInt(w))
        this.error = blob.error
        this.priority = 0
        this.comment = blob.comment || ""
        this.hasEval = blob.hasEval || false
        this.eval = blob.eval || null
        return this
    }

    props(){
        return parseProps(this.comment)
    }

    drawings(){
        return parseDrawings(this.comment)
    }

    fullmovenumber(){
        let parent = this.getparent()
        if(!parent) return null
        return parseInt(parent.fen.split(" ")[5])
    }

    regid(){
        return this.id.replace(/\+/g, "\\+")
    }

    subnodes(){
        let subnodes = []
        for(let id in this.parentgame.gamenodes){
            if( id.match(new RegExp(`^${this.regid()}_`)) ){
                subnodes.push(this.parentgame.gamenodes[id])
            }
        }
        return subnodes
    }
    
    turn(){
        return this.fen.match(/ w/)
    }

    getparent(){
        if(this.parentid) return this.parentgame.gamenodes[this.parentid]
        return null
    }

    siblings(excludethis){
        if(!this.parentid) return []
        let childs = this.getparent().sortedchilds()
        if(excludethis) childs = childs.filter((child)=>child.id != this.id)
        return childs
    }

    geterror(){
        return this.error ? this.error : 0
    }

    moderror(dir){
        this.error = this.geterror() + dir
        if(this.error < 0) this.error = 0
    }

    moderrorrec(dir){        
        let node = this
        while(node){            
            node.moderror(dir)            
            node = node.getparent()
            if(node) node = node.getparent()
        }
    }

    opptrainweight(){
        return this.weights[0] + this.weights[1]
    }

    metrainweight(){
        return this.weights[0]
    }

    sortweight(){
        return this.priority * 100 + this.weights[0] * 10 + this.weights[1]
    }

    sortchildids(ida, idb){
        let a = this.parentgame.gamenodes[ida]
        let b = this.parentgame.gamenodes[idb]
        return b.sortweight() - a.sortweight()
    }

    sortedchilds(){
        return this.childids.sort(this.sortchildids.bind(this)).map((childid)=>this.parentgame.gamenodes[childid])
    }

    sortedchildsopp(){
        return this.sortedchilds().filter((child)=>child.opptrainweight() > 0)
    }

    sortedchildsme(){
        return this.sortedchilds().filter((child)=>child.metrainweight() > 0)
    }

    revsortedchilds(){
        return this.sortedchilds().reverse()
    }

    serialize(){
        return{
            id: this.id,
            genalgeb: this.genalgeb,
            gensan: this.gensan,
            fen: this.fen,
            childids: this.childids,
            parentid: this.parentid,
            weights: this.weights,
            error: this.error,
            comment: this.comment,
            hasEval: this.hasEval,
            eval: this.eval
        }
    }

    clone(){
        return GameNode().fromblob(this.parentgame, this.serialize())
    }
}
function GameNode(){return new GameNode_()}

const UNSEAT                = true
const UNSEAT_PLAYER_DELAY   = 5 * 60 * 1000

const DURATION_VERBAL       = true

function formatDuration(ms, verbal){
    const sec = 1000
    const min = 60 * sec
    const hour = 60 * min
    let buff = ""
    let h = Math.floor(ms / hour)
    if(ms > hour){        
        ms = ms - h * hour
        buff += `${h} hour`
        if(h > 1) buff += "s"
        buff += " , "
    }
    let m = Math.floor(ms / min)
    if(ms > min){        
        ms = ms - m * min
        buff += `${m} minute`
        if(m > 1) buff += "s"
        buff += " , "
    }
    let s = Math.floor(ms / sec)
    buff += `${s} second`
    if(s > 1) buff += "s"
    if(verbal) return buff
    let hp = ("" + h).padStart(2, "0")
    let mp = ("" + m).padStart(2, "0")
    let sp = ("" + s).padStart(2, "0")
    return `${hp}:${mp}:${sp}`
}

class OrderedHash_{
    constructor(blob){
        this.fromBlob(blob)
    }

    fromBlob(blobOpt){        
        this.blob = blobOpt || []
        return this
    }

    getKey(key){
        return this.blob.find(entry => entry[0] == key)
    }

    get(key){
        let entry = this.getKey(key)
        if(entry) return entry[1]
        return null
    }

    setKey(key, value){
        let entry = this.getKey(key)

        if(entry){
            entry[1] = value
            return
        }

        this.blob.push([key, value])
    }
}
function OrderedHash(blobOpt){return new OrderedHash_(blobOpt)}

function displayNameForVariantKey(variantKey){
    return variantKey.substring(0,1).toUpperCase() + variantKey.substring(1)
}

function pgnVariantToVariantKey(pgnVariant){    
    return pgnVariant.substring(0,1).toLowerCase() + pgnVariant.substring(1)
}

function parsePgnPartsFromLines(lines){
    let parseHead = true
    let parseBody = false
    let headers = []
    let bodyLines = []

    // remove leading empty lines
    while(lines.length && (!lines[0])) lines.shift()
    
    do{
        let line = lines.shift()
        let m
        if(parseHead){
            if(!line){
                parseHead = false
            }else if(m = line.match(/^\[([^ ]+) \"([^\"]+)/)){                
                headers.push([m[1], m[2]])
            }else{
                parseHead = false
                lines.unshift(line)
            }
        }else{
            if(parseBody){
                if(!line){
                    return [lines, headers, bodyLines.join("\n")]
                }else{
                    bodyLines.push(line)
                }
            }else if(line){
                parseBody = true
                bodyLines.push(line)
            }
        }
    }while(lines.length)
    
    return [lines, headers, bodyLines.join("\n")]
}

const UPDATE_THINKING_TIME      = true
const FOLD_REPETITION           = 3

class Game_{
    constructor(props){       
        this.fromblob(props)
    }

    getRandomMove(){
        let lms = this.board.legalmovesforallpieces()

        if(lms.length){
            let index = Math.floor(Math.random() * lms.length)

            let move = lms[index]

            return move
        }

        return null
    }

    getForwardMove(){
        let scs = this.getcurrentnode().sortedchilds()        
        if(!scs.length) return null
        return scs[0].getMove()
    }

    offerDraw(player){
        let find = this.players.hasPlayer(player)
        if(!find){
            return `Only playing sides can offer draw.`
        }
        find.offerDraw = true
        if(this.drawAccepted()){
            this.terminate(
                0.5,
                "draw agreed"
            )
        }
        return true
    }

    revokeDraw(player){
        let find = this.players.hasPlayer(player)
        if(!find){
            return `Only playing sides can revoke draw.`
        }
        find.offerDraw = false
        return true
    }

    drawOffered(){
        let result = false
        this.players.forEach(pl => {
            if(pl.offerDraw) result = true
        })
        return result
    }

    drawAccepted(){
        let result = true
        this.players.forEach(pl => {
            if(!pl.offerDraw) result = false
        })
        return result
    }

    turnPlayer(){
        return this.players.getByColor(this.board.turn)
    }

    oppTurnPlayer(){
        return this.players.getByColor(!this.board.turn)
    }

    canMakeMove(player){        
        return this.turnPlayer().equalTo(player)
    }

    turnMoveTime(){
        return new Date().getTime() - this.turnPlayer().startedThinkingAt
    }

    turnTimeLeft(){
        return Math.max(this.turnPlayer().thinkingTime - this.turnMoveTime(), 0)
    }

    checkTurnTimedOut(updateThinkingTime){
        if(!this.inProgress) return false
        let tl = this.turnTimeLeft()        
        if(updateThinkingTime) this.turnPlayer().thinkingTime = tl
        if(tl <= 0){            
            this.terminate(
                (this.board.turn == WHITE) ? 0 : 1,
                "flagged"
            )
            return true
        }
        return false
    }

    isRepetition(times){
        let mults = {}

        for(let id in this.gamenodes){
            let node = this.gamenodes[id]
            let sfen = strippedfen(node.fen)
            if(mults[sfen]) mults[sfen]++
            else mults[sfen] = 1
            if(mults[sfen] >= times) return true
        }

        return false
    }

    makeSanMoveResult(san){
        if(this.checkTurnTimedOut(UPDATE_THINKING_TIME)){
            return true
        }else if(this.makeSanMove(san)){
            let status = this.board.status()
            if(status.terminated){
                this.terminate(
                    status.result,
                    status.resultReason
                )
                return true
            }
            if(this.isRepetition(FOLD_REPETITION)){
                this.terminate(
                    0.5,
                    "threefold repetition"
                )
                return true
            }
            this.oppTurnPlayer().thinkingTime += this.timecontrol.increment * 1000
            this.startThinking()
            return true
        }
        return `Illegal move.`
    }

    makeSanMove(sanOpt){        
        let m = sanOpt.match(/[0-9\.]*(.*)/)

        let san = m[1]

        if(!san) return false

        let move = this.board.santomove(san)

        if(move){
            this.makemove(move)
            return true
        }

        return false
    }

    mergeGameRecursive(node){
        for(let child of node.sortedchilds()){
            if(this.makeSanMove(child.gensan)){
                if(child.comment) this.getcurrentnode().comment = child.comment
                this.mergeGameRecursive(child)
                this.back()
            }
        }
    }

    mergeGame(game){
        let gameRootFen = game.getrootnode().fen
        let rootFen = this.getcurrentnode().fen

        if(gameRootFen != rootFen){
            return `Merge game failed. Game root fen does not match current fen.`
        }

        this.mergeGameRecursive(game.getrootnode())

        return `Game merged ok.`
    }

    buildFromPGN(headers, body, variantOpt){
        let variant = variantOpt || DEFAULT_VARIANT

        let board = ChessBoard().setfromfen(null, variant)
        let fen = board.fen

        this.pgnHeaders = OrderedHash(headers)
        this.pgnBody = body

        let setVariant = this.pgnHeaders.get("Variant")
        let setFen = this.pgnHeaders.get("FEN")

        if(setVariant) variant = pgnVariantToVariantKey(setVariant)
        if(setFen) fen = setFen

        this.setfromfen(fen, variant)

        let acc = ""
        let commentLevel = 0

        let nodeStack = []

        for(let c of (this.pgnBody + " ").split("")){            
            if(c == "("){
                if(commentLevel){
                    acc += c
                }else{
                    if(acc){
                        this.makeSanMove(acc)
                        acc = ""                  
                    }                    
                    nodeStack.push(this.getcurrentnode().clone())                                                       
                    this.back()
                }                
            }else if(c == ")"){
                if(commentLevel){
                    acc += c
                }else{  
                    if(acc){
                        this.makeSanMove(acc)
                        acc = ""                  
                    }                    
                    this.setfromnode(nodeStack.pop())                    
                }                   
            }else if(c == "{"){                
                if(commentLevel){
                    acc += "{"
                }else{
                    if(acc){
                        this.makeSanMove(acc)
                        acc = ""                  
                    }                    
                }
                commentLevel++                
            }else if(c == "}"){
                if(commentLevel){                    
                    commentLevel--
                    if(commentLevel){
                        acc += "}"
                    }else{
                        if(acc){
                            this.getcurrentnode().comment = acc
                            acc = ""
                        }
                    }
                }                
            }else{
                if(c == " "){
                    if(commentLevel){
                        acc += " "
                    }else if(acc){
                        this.makeSanMove(acc)
                        acc = ""
                    }
                }else{
                    acc += c
                }
            }
        }

        return this
    }

    parsePGN(pgn, variantOpt){
        let parseResult = parsePgnPartsFromLines(pgn.split("\n"))

        this.buildFromPGN(parseResult[1], parseResult[2], variantOpt)

        return [ parseResult[0], this ]
    }

    setHeaders(blob){
        this.pgnHeaders.fromBlob(blob)
        this.setDefaultPgnHeaders()
    }

    nodesForFen(fen){
        return Object.entries(this.gamenodes)
            .filter(gne => gne[1].parentid)
            .filter(gne => strippedfen(gne[1].getparent().fen) == strippedfen(fen))
            .map(gne => gne[1])
    }

    bookForFen(fen){        
        let book = {}
        this.nodesForFen(fen).forEach(node => {
            if(!book[node.genalgeb]) book[node.genalgeb] = [0,0]
            book[node.genalgeb][0] += node.weights[0]
            book[node.genalgeb][1] += node.weights[1]
        })
        return book
    }

    weightedAlgebForFen(fen, indices){
        let buff = []
        let book = this.bookForFen(fen)        
        for(let algeb in book){
            let mult = indices.reduce((acc, curr) => acc + book[algeb][curr], 0)
            buff = buff.concat(Array(mult).fill(algeb))
        }                
        if(!buff.length) return null
        return buff[Math.floor(Math.random() * buff.length)]
    }

    get allNodes(){
        return Object.entries(this.gamenodes).map(entry => entry[1])
    }

    get forAllNodes(){
        return this.allNodes.forEach
    }

    removePriority(){
        this.forAllNodes(node => node.priority = 0)
    }

    fen(){
        return this.getcurrentnode().fen
    }

    merge(g){
        this.removePriority()
        g.tobegin()
        this.tobegin()
        if(g.fen() != this.fen()) return "Merge failed, starting positions don't match."
        let i = 0
        while(g.forward()){
            let san = g.getcurrentnode().gensan
            let move = this.board.santomove(san)
            if(!move) return `Merge detected invalid san ( move: ${i}, san: ${san} ).`
            this.makemove(move)
            let currentnode = this.getcurrentnode()
            for(let sibling of currentnode.siblings(EXCLUDE_THIS)) sibling.priority = 0
            currentnode.priority = 1
            i++
        }
        return `Merged all ${i} move(s) ok.`
    }

    fromsans(sans){
        this.setfromfen(getvariantstartfen(this.variant))
        for(let san of sans){
            let move = this.board.santomove(san)
            if(move){
                this.makemove(move)
            }else{
                return this
            }
        }
        return this
    }

    setfromfen(fenopt, variantopt){        
        this.variant = variantopt || this.variant 
        this.board.setfromfen(fenopt, this.variant)
        this.gamenodes = {
            root: GameNode().fromblob(this, {
                parentgame: this,
                id: "root",
                genalgeb: null,
                gensan: null,
                fen: this.board.fen                
            })
        }
        this.currentnodeid = "root"
        this.pgnHeaders.blob = []
        this.setDefaultPgnHeaders()
        return this
    }

    reset(variant){
        this.setfromfen(null, variant)
    }

    setfromnode(node){
        this.currentnodeid = node.id
        this.board.setfromfen(this.getcurrentnode().fen, this.variant)
    }

    makemove(move){
        let algeb = this.board.movetoalgeb(move)
        let san = this.board.movetosan(move)

        this.board.push(move)

        this.makemovenode(GameNode().fromblob(this, {                        
            genalgeb: algeb,
            gensan: san,
            fen: this.board.fen
        }))
    }

    setTimecontrol(player, blob){
        if(this.players.hasSeatedPlayer(player)){
            this.variant = blob.variant
            this.timecontrol = Timecontrol(blob.timecontrol)
            return true
        }else{
            return `Only seated players can set time control.`
        }
    }

    hasAllPlayers(){
        return this.players.getByColor(WHITE).seated && this.players.getByColor(BLACK).seated
    }

    terminate(result, reason){
        this.inProgress = false
        this.terminated = true
        this.terminatedAt = new Date().getTime()
        this.result = result
        this.resultReason = reason
        this.players.forEach(pl => {
            pl.seated = false
            pl.seatedAt = null
        })

        if(this.terminationCallback){
            this.terminationCallback()
        }
    }

    resignPlayer(player){
        if(!this.inProgress) return `You can only resign an ongoing game.`
        if(this.players.hasPlayer(player)){            
            if(player.index == 0) this.terminate(
                1,
                "black resigned"
            )
            else this.terminate(
                0,
                "white resigned"
            )
            return true
        }else{
            return `You can only resign your own game.`
        }
    }

    sitPlayer(player, UNSEAT){
        let pl = this.players.getByIndex(player.index)
        if(pl.seated && (pl.id != player.id)){
            let elapsed = new Date().getTime() - pl.seatedAt
            if(elapsed < UNSEAT_PLAYER_DELAY) return `Player can be unseated after ${formatDuration(UNSEAT_PLAYER_DELAY - elapsed, DURATION_VERBAL)}.`
        }
        if(UNSEAT){
            player = Player().setIndex(player.index)
        }else{            
            if(this.players.hasSeatedPlayer(player)) return `Already seated.`
            player.seated = true
            player.seatedAt = new Date().getTime()
        }        
        this.players.setPlayer(player)
        if(this.hasAllPlayers()){
            this.startGame()
        }else{
            if(this.terminated){
                this.playerSeatedAfterTermination = true        }
            }            
        return true
    }

    startThinking(){
        this.turnPlayer().startedThinkingAt = new Date().getTime()
    }

    startGame(){
        this.inProgress = true
        this.terminated = false
        this.result = null
        this.resultReason = "in progress"
        this.setfromfen(null, this.variant)
        this.players.forEach(pl => {
            pl.thinkingTime = this.timecontrol.initial * 60 * 1000
            pl.offerDraw = false
        })
        this.startedAt = new Date().getTime()
        this.playerSeatedAfterTermination = false
        this.chat.messages = []
        this.startThinking()
        if(this.startCallback) this.startCallback()
    }

    // gbl
    fromblob(blobOpt){
        let blob = blobOpt || {}

        this.board = ChessBoard()
        this.variant = blob.variant || DEFAULT_VARIANT                
        this.pgnHeaders = OrderedHash(blob.pgnHeaders)
        this.pgnBody = blob.pgnBody || "*"        

        this.setfromfen(null, null)                
        let gamenodesserialized = blob.gamenodes || {}        
        for(let id in gamenodesserialized){
            this.gamenodes[id] = GameNode().fromblob(this, gamenodesserialized[id])
        }
        this.currentnodeid = blob.currentnodeid || "root"
        this.board.setfromfen(this.getcurrentnode().fen, this.variant)

        this.setDefaultPgnHeaders()

        this.flip = !!blob.flip        
        this.animations = blob.animations || []
        this.selectedAnimation = blob.selectedAnimation
        this.animationDescriptors = blob.animationDescriptors || {}                
        this.timecontrol = Timecontrol(blob.timecontrol)
        this.players = Players(blob.players)
        this.inProgress = !!blob.inProgress
        this.terminated = !!blob.terminated
        this.result = blob.result
        this.resultReason = blob.resultReason || "in progress"
        this.startedAt = blob.startedAt || null
        this.terminatedAt = blob.terminatedAt || null
        this.chat = Chat(blob.chat)
        this.playerSeatedAfterTermination = blob.playerSeatedAfterTermination
        return this
    }

    playersVerbal(){
        return `${this.players.getByColor(WHITE).qualifiedDisplayName(SHOW_RATING)} - ${this.players.getByColor(BLACK).qualifiedDisplayName(SHOW_RATING)}`
    }

    resultVerbal(){
        if(this.result == 1) return "1 - 0"
        if(this.result == 0) return "0 - 1"
        return "1/2 - 1/2"
    }

    setDefaultPgnHeaders(){
        this.pgnHeaders.setKey("Variant", displayNameForVariantKey(this.variant))
        this.pgnHeaders.setKey("FEN", this.getrootnode().fen)
    }

    subtree(node, nodes, line){
        let clone = node.clone()
        if(!nodes){
            nodes = {}
            clone.id = "root"
            clone.genalgeb = null
            clone.gensan = null
            clone.parentid = null
            line = ["root"]
        }else{
            clone.id = line.join("_")
            clone.parentid = line.slice(0, line.length -1).join("_")
        }
        nodes[clone.id] = clone
        let newchildids = []
        for(let child of node.sortedchilds()){
            let childline = line.concat(child.gensan)
            this.subtree(child, nodes, childline)
            let childid = childline.join("_")
            newchildids.push(childid)            
        }
        clone.childids = newchildids
        return nodes
    }

    subtreeSize(nodeOpt){
        let node = nodeOpt || this.getcurrentnode()
        return Object.entries(this.subtree(node)).length
    }

    reduce(nodeOpt){
        let node = nodeOpt || this.getcurrentnode()
        return Game().fromblob({...this.serialize(), ...{            
            gamenodes: this.subtree(node),
            currentnodeid: "root"
        }})
    }

    reduceLine(nodeOpt){
        let current = nodeOpt || this.getcurrentnode()

        while(current.parentid){
            let child = current
            current = current.getparent()
            if(current.childids.length > 1){
                current.sortedchilds().slice(1).forEach(child => {
                    for(let id in this.gamenodes){
                        if( id.match(new RegExp(`^${child.regid()}`)) ){
                            delete this.gamenodes[id]
                        }
                    }            
                })
            }
            current.childids = [child.id]
        }
    }

    pgninfo(fromroot){
        let rootnode = this.getrootnode()
        let pgnMoves = []
        let oldcurrentnodeid = this.currentnodeid
        if(fromroot){            
            this.currentnodeid = "root"
            while(this.forward()){
                pgnMoves.push(this.getcurrentnode().gensan)
            }            
        }else{
            let currentnode = this.getcurrentnode()
            while(this.back()){
                pgnMoves.unshift(currentnode.gensan)
                currentnode = this.getcurrentnode()
            }
        }
        this.currentnodeid = oldcurrentnodeid
        return {
            variant: this.variant,
            initialFen: rootnode.fen,
            pgnMoves: pgnMoves,
            white: "?",
            black: "?",
            date: "?"
        }
    }

    movewithnumber(node, force, docomments, reportAsUCI){
        let fenparts = node.fen.split(" ")
        let number = fenparts[5] + "."
        if(fenparts[1] == "w") number = "" + ( parseInt(fenparts[5]) - 1 ) + ".."
        let comments = ""
        if(docomments) if(node.comment) comments = ` { ${node.comment} }`
        if(typeof docomments == "object"){            
            comments = ""
            let analysisinfo = docomments[node.analysiskey]
            if(analysisinfo){
                let rai = new RichAnalysisInfo(analysisinfo)
                if(rai.hasScorenumerical){
                    let scorenumerical = -rai.scorenumerical
                    comments = ` { ${(scorenumerical > 0 ? "+":"") + scorenumerical} }`
                }                
            }
            if(node.hasEval){
                let scorenumerical = -node.eval
                comments = ` { ${(scorenumerical > 0 ? "+":"") + scorenumerical} }`
            }
        }
        return `${((fenparts[1] == "b")||force)?number + " ":""}${reportAsUCI ? node.genalgeb : node.gensan}${comments}`
    }

    line(docomments, nodeOpt, reportAsUCI){
        let current = nodeOpt || this.getcurrentnode()
        let nodes = []
        while(current){
            nodes.unshift(current)
            current = current.getparent()
        }
        nodes.shift()
        let first = true        
        return nodes.map((node)=>{            
            let mn = this.movewithnumber(node, first, docomments, reportAsUCI)
            first = false            
            return mn
        }).join(" ")
    }

    multiPGN(params){        
        let childs = params.rootNode.sortedchilds()

        if(!childs.length){            
            return params.buff
        }

        let mainChild = childs[0]

        if(!params.variationStart) params.buff += " "
        params.buff += this.movewithnumber(mainChild, params.variationStart, params.docomments, params.reportAsUCI)

        if(childs.length > 1){            
            for(let child of childs.slice(1)){
                params.buff += " ( "                            
                params.buff += this.movewithnumber(child, true, params.docomments, params.reportAsUCI)
                params.buff = this.multiPGN({
                    docomments: params.docomments,
                    rootNode: child,
                    variationStart: false,
                    buff: params.buff
                })
                params.buff += " )"            
            }            
        }

        return this.multiPGN({
            docomments: params.docomments,
            rootNode: mainChild,
            variationStart: false,
            buff: params.buff,
            reportAsUCI: params.reportAsUCI
        })
    }

    reportPgnHeaders(rootNode){
        this.pgnHeaders.setKey("FEN", rootNode ? rootNode.fen : this.getrootnode().fen)
        let buff = this.pgnHeaders.blob.map(entry => `[${entry[0]} "${entry[1]}"]`).join("\n")
        this.pgnHeaders.setKey("FEN", this.getrootnode().fen)
        return buff
    }

    pgn(docomments, rootNodeOpt, domulti, keepBaseLine, reportAsUCI){
        let rootNode = rootNodeOpt || this.getrootnode()

        return `${this.reportPgnHeaders(keepBaseLine ? this.getrootnode() : rootNode)}\n\n${domulti ? this.multiPGN({
            docomments: docomments,
            rootNode: rootNode,
            variationStart: (!keepBaseLine) || (rootNode.id == "root"),
            buff: keepBaseLine ? this.line(!DO_COMMENTS, rootNode, reportAsUCI) : "",
            reportAsUCI: reportAsUCI
        }) : this.line(docomments, null, reportAsUCI)}`
    }

    getcurrentnode(){
        return this.gamenodes[this.currentnodeid]
    }

    getrootnode(){
        return this.gamenodes["root"]
    }

    tnodecmp(a, b){
        return b.subnodes().length - a.subnodes().length
    }

    transpositions(nodeOpt){        
        let node = nodeOpt || this.getcurrentnode()
        let tnodesentries = Object.entries(this.gamenodes).filter((entry)=>entry[1].fen == node.fen)        
        let tnodes = tnodesentries.map((entry)=>entry[1])
        tnodes.sort(this.tnodecmp)        
        return tnodes
    }

    makemovenode(gamenode){                
        let currentnode = this.getcurrentnode()
        gamenode.id = this.currentnodeid + "_" + gamenode.gensan
        if(!currentnode.childids.includes(gamenode.id)){
            currentnode.childids.push(gamenode.id)
            gamenode.parentid = this.currentnodeid
            this.gamenodes[gamenode.id] = gamenode
        }
        this.currentnodeid = gamenode.id
        let besttranspositionid = this.transpositions(this.getcurrentnode())[0].id
        // switch to best transposition
        //this.currentnodeid = besttranspositionid
        this.board.setfromfen(this.getcurrentnode().fen, this.variant)
    }

    back(){
        let currentnode = this.getcurrentnode()
        if(currentnode.parentid){
            this.currentnodeid = currentnode.parentid
            this.board.setfromfen(this.getcurrentnode().fen, this.variant)
            return true
        }
        return false
    }

    del(){        
        let oldcurrentnode = this.getcurrentnode()
        let parentid = oldcurrentnode.parentid
        if(parentid){                        
            for(let id in this.gamenodes){
                if( id.match(new RegExp(`^${oldcurrentnode.regid()}`)) ){
                    delete this.gamenodes[id]
                }
            }            
            this.currentnodeid = parentid
            let currentnode = this.getcurrentnode()
            currentnode.childids = currentnode.childids.filter((childid)=>childid != oldcurrentnode.id)
            this.board.setfromfen(this.fen(), this.variant)
            return true
        }
        return false
    }

    tobegin(){
        if(!this.back()) return false
        while(this.back());        
        return true
    }

    toend(){
        if(!this.forward()) return false
        while(this.forward());        
        return true
    }

    forward(){
        let currentnode = this.getcurrentnode()
        if(currentnode.childids.length > 0){
            this.currentnodeid = currentnode.sortedchilds()[0].id
            this.board.setfromfen(this.getcurrentnode().fen, this.variant)
            return true
        }
        return false
    }

    // gsr
    serialize(){
        let gamenodesserialized = {}
        for(let id in this.gamenodes){
            gamenodesserialized[id] = this.gamenodes[id].serialize()
        }
        return{
            variant: this.variant,            
            flip: this.flip,
            gamenodes: gamenodesserialized,
            currentnodeid: this.currentnodeid,
            animations: this.animations,
            selectedAnimation: this.selectedAnimation,
            animationDescriptors: this.animationDescriptors,
            pgnHeaders: this.pgnHeaders.blob,
            pgnBody: this.pgnBody,
            timecontrol: this.timecontrol.serialize(),
            players: this.players.serialize(),
            inProgress: this.inProgress,
            terminated: this.terminated,
            result: this.result,
            resultReason: this.resultReason,
            startedAt: this.startedAt,
            terminatedAt: this.terminatedAt,
            chat: this.chat.serialize(),
            playerSeatedAfterTermination: this.playerSeatedAfterTermination,
        }
    }

    clone(){
        return Game().fromblob(this.serialize())
    }
}
function Game(props){return new Game_(props)}

///////////////////////////////////////////////////////////////////////////////////////////
function createExports(){
    module.exports.ChessBoard = ChessBoard
}

if(typeof module != "undefined") if(typeof module.exports != "undefined") createExports()
///////////////////////////////////////////////////////////////////////////////////////////

const ENGINE_READY = 0
const ENGINE_RUNNING = 1
const ENGINE_STOPPING = 2

const MATE_SCORE = 10000

const VERBOSE = false

class AbstractEngine{
  setcommand(command, payload){
    this.command = command
    this.payload = payload
    if(VERBOSE) console.log("setcommand", command, payload)
  }

  play(initialFen, moves, variant, timecontrol, moveOverHead){
      return P(resolve =>{
          this.resolvePlay = resolve
          this.go({
              fen: initialFen,
              moves: moves,
              variant: variant,
              timecontrol: timecontrol,
              moveOverHead: moveOverHead
          })
      })
  }

  processstdoutline(line){           
      if(line.match(/^info string/)) return
    if(VERBOSE) console.log("line", line)

    let bm = line.match(/^bestmove ([^\s]+)/)

    if(bm){
      let bestmove = bm[1]

      if(VERBOSE) console.log("bestmove received " + bestmove)      

      this.analysisinfo.state = ENGINE_READY

      this.sendanalysisinfo(this.analysisinfo)

      if(this.resolvePlay){          
          let scorenumerical = null
          try{
            scorenumerical = this.analysisinfo.summary[0].scorenumerical
          }catch(err){}          
          this.resolvePlay({bestmove: bestmove, scorenumerical: scorenumerical})
          this.resolvePlay = null
      }

      return
    }

    if(line.match(/^info/)){        
      let depth = null
      let mdepth = line.match(/ depth (.+)/)

      if(mdepth){
        depth = parseInt(mdepth[1])          
      }                

      let mtime = line.match(/ time (.+)/)

      if(mtime){
        this.analysisinfo.time = parseInt(mtime[1])          
      }                

      let mnodes = line.match(/ nodes (.+)/)

      if(mnodes){
        this.analysisinfo.nodes = parseInt(mnodes[1])          
      }                

      let mnps = line.match(/ nps (.+)/)

      if(mnps){
        this.analysisinfo.nps = parseInt(mnps[1])          
      }                

      let move = null

      let mp = line.match(/ pv (.+)/)      

      if(mp){        
        let pv = mp[1].split(" ")        
        move = pv[0]                  
        let state = this.analyzedboard.getstate()
        let pvsan = []
        for(let algeb of pv){
          try{              
            let move = this.analyzedboard.algebtomove(algeb)                        
            pvsan.push(this.analyzedboard.movetosan(move))            
            this.analyzedboard.push(move)
          }catch(err){
            if(VERBOSE) console.log(err)                                                
          }                                
        }

        this.pvsans[move] = pvsan
        this.pvalgebs[move] = pv
        this.analyzedboard.setstate(state)
      } 

      if(depth){
        if(depth < this.highestdepth) return
        this.highestdepth = depth
      }      

      if(!move) return

      let scorecp = null

      let mscp = line.match(/ score cp (.+)/)

      if(mscp){
        scorecp = parseInt(mscp[1])
      }

      let scoremate = null

      let msmate = line.match(/ score mate (.+)/)

      if(msmate){
        scoremate = parseInt(msmate[1])
      }

      let scorenumerical = scorecp

      if(scoremate){
        if(scoremate < 0){
          scorenumerical = - MATE_SCORE - scoremate
        }else{
          scorenumerical = MATE_SCORE - scoremate
        }
      }        

      this.pvs[move] = {depth: this.highestdepth, scorecp: scorecp, scoremate: scoremate, scorenumerical: scorenumerical}        

      let newpvs = {}

      for(let move in this.pvs){
        if(this.pvs[move].depth >= (this.highestdepth - 1)){
          newpvs[move] = this.pvs[move]
        }
      }

      this.pvs = newpvs        

      this.sortedpvs = Object.keys(this.pvs)
        .sort((a, b)=>this.pvs[b].scorenumerical - this.pvs[a].scorenumerical)                                
        .sort((a, b)=>this.pvs[b].depth - this.pvs[a].depth)                                
    
    let pvsAtDepth = {}
    this.completeddepth = 0
    for(let move of this.sortedpvs.slice(0, this.multipv)){            
        let currentdepth = this.pvs[move].depth
        if(typeof pvsAtDepth[currentdepth] != "undefined"){
            pvsAtDepth[currentdepth]++
        }else{
            pvsAtDepth[currentdepth]=1
        }
        if(pvsAtDepth[currentdepth] >= this.multipv){
            this.completeddepth = currentdepth
        }
    }

      if(this.completeddepth > this.lastcompleteddepth){
        this.lastcompleteddepth = this.completeddepth        
        let summary = []
        let i = 0
        for(let uci of this.sortedpvs.slice()){
          if(i<this.multipv){            
            summary.push({
              multipv: i+1,
              depth: this.lastcompleteddepth,
              uci: uci,
              scorenumerical: this.pvs[uci].scorenumerical,
              pvsans: this.pvsans[uci]
            })                    
          }        
          i++
        }

        this.analysisinfo.lastcompleteddepth = this.lastcompleteddepth
        this.analysisinfo.summary = summary

        if(VERBOSE) console.log("summary", summary, "mindepth", this.minDepth, "lascompleteddepth", this.analysisinfo.lastcompleteddepth)
        
        if(this.analysisinfo.lastcompleteddepth >= ( this.minDepth ? this.minDepth : 0 ) ){            
            if(VERBOSE) console.log("sending analysisinfo")
          this.sendanalysisinfo(this.analysisinfo)
        }        
      }
    }      
  }

  sendcommandtoengine(command){
      // abstract
  }

  issuecommand(command){
      if(VERBOSE) console.log("engine command", command)

      this.sendcommandtoengine(command)
  }

  go(payload){
    this.highestdepth = 0
    this.completeddepth = 0
    this.lastcompleteddepth = 0
    this.pvs = {}
    this.pvsans = {}
    this.pvalgebs = {}
    this.sortedpvs = []
    this.time = 0
    this.nodes = 0
    this.nps = 0

    this.multipv = payload.multipv || 1            
    this.threads = payload.threads || 1            
    this.analyzedfen = payload.fen     
    this.moves = payload.moves    
    this.timecontrol = payload.timecontrol
    this.variant = payload.variant || DEFAULT_VARIANT        
    this.analysiskey = payload.analysiskey || `analysis/${this.variant}/${strippedfen(this.analyzedfen)}`               
    this.analyzedboard = ChessBoard().setfromfen(this.analyzedfen, this.variant)
    this.moveOverHead = payload.moveOverHead || DEFAULT_MOVE_OVERHEAD

    let lms = this.analyzedboard.legalmovesforallpieces()

    if( lms.length < this.multipv ) this.multipv = lms.length

    if(this.multipv == 0){
        return
    }

    this.analysisinfo = {      
      multipv: this.multipv,    
      threads: this.threads,    
      analyzedfen: this.analyzedfen,        
      variant: this.variant,
      analysiskey: this.analysiskey,
      lastcompleteddepth: 0,
      summary: []
    }

    this.issuecommand(`setoption name UCI_Variant value ${this.variant == "standard" ? "chess" : this.variant}`)
    this.issuecommand(`setoption name MultiPV value ${this.multipv}`)        
    this.issuecommand(`setoption name Threads value ${this.threads}`)        
    this.issuecommand(`setoption name Move Overhead value ${this.moveOverHead}`)        
    this.issuecommand(`position fen ${this.analyzedfen}${this.moves ? " moves " + this.moves : ""}`)
    
    let goCommand = `go${this.timecontrol ? " wtime " + this.timecontrol.wtime + " winc " + this.timecontrol.winc + " btime " + this.timecontrol.btime + " binc " + this.timecontrol.binc : " infinite"}`
    
    this.issuecommand(goCommand)

    this.analysisinfo.state = ENGINE_RUNNING    

    this.sendanalysisinfo(this.analysisinfo)
  }

  stop(){
    if(this.analysisinfo.state != ENGINE_RUNNING) return

    this.issuecommand("stop")

    this.analysisinfo.state = ENGINE_STOPPING    

    this.sendanalysisinfo(this.analysisinfo)
  }

  spawnengineprocess(){
      // abstract
  }

  spawn(){
      this.summary = [ "engine ready" ]

      this.analysisinfo = {
        state: ENGINE_READY,
        summary: [],        
        lastcompleteddepth: 0,        
        time: 0,
        nodes: 0,
        nps: 0,
        multipv: null,
        analyzedfen: null,        
        variant: null,
        threads: null,
        analysiskey: null,
      }

      this.spawnengineprocess()
  }

  checkcommand(){    
    if(this.command){
        if(this.command == "go"){                
            if(this.analysisinfo.state != ENGINE_READY){            
                this.stop()          
            }else{          
                this.go(this.payload)
                this.command = null
            }
        }
        if(this.command == "stop"){        
            this.stop()          
            this.command = null
        }      
    }
  }

  constructor(sendanalysisinfo, path){      
      this.sendanalysisinfo = sendanalysisinfo

      this.path = path

      this.spawn()

      setInterval(this.checkcommand.bind(this), 200)
  }
}

class RichAnalysisInfo{
    constructor(analysisinfo){
        this.analysisinfo = analysisinfo

        this.board = ChessBoard().setfromfen(analysisinfo.analyzedfen, analysisinfo.variant)

        this.lms = this.board.legalmovesforallpieces()

        for(let item of this.analysisinfo.summary){
            let move = this.board.movefromalgeb(item.uci)
            item.move = move
            let detailedmove = this.board.algebtomove(item.uci)
            if(detailedmove){
                item.san = this.board.movetosan(detailedmove)                
                item.detailedmove = detailedmove                                
            }
        }

        this.analysisinfo.summary = this.analysisinfo.summary.filter(item => item.pvsans.length > 0)
    }

    get hasScorenumerical(){
        if(!this.analysisinfo.summary.length) return false
        let scorenumerical = this.analysisinfo.summary[0].scorenumerical        
        return (typeof scorenumerical == "number")
    }

    get scorenumerical(){
        return this.hasScorenumerical ? this.analysisinfo.summary[0].scorenumerical : null
    }

    get running(){
        return this.analysisinfo.state != ENGINE_READY
    }

    live(live){
        this.isLive = live
        if(!this.running) this.isLive = false
        return this
    }

    asText(){        
        let npsInfo = this.isLive ? ` --> nps ${this.analysisinfo.nps || "0"}` : ""
        return `--> ${this.isLive ? "running -->" : "stored  -->"} depth  ${this.analysisinfo.lastcompleteddepth.toString().padEnd(3, " ") + npsInfo}\n${this.analysisinfo.summary.map(item => item.pvsans[0].padEnd(8, " ") + ((item.scorenumerical < 0 ? "" : "+") + item.scorenumerical.toString()).padEnd(8, " ") + "-> " + item.pvsans.slice(1, Math.min(item.pvsans.length, 6)).join(" ")).join("\n")}`
    }
}

if(typeof module != "undefined") if(typeof module.exports != "undefined"){
    module.exports = {
        AbstractEngine: AbstractEngine,
        VARIANT_TO_ENGINE: VARIANT_TO_ENGINE,
        ChessBoard: ChessBoard,
        Glicko: Glicko,
        Player: Player,
        Players: Players,
        Game: GameNode,
        Game: Game,    
        ChatMessage: ChatMessage,    
        Chat: Chat,
        MAX_NUM_PLAYERS: MAX_NUM_PLAYERS,
        UNSEAT: UNSEAT,
        Square: Square,
        Piece: Piece
    }
}

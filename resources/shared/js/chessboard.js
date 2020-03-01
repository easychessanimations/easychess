const SUPPORTED_VARIANTS = [
    ["standard", "Standard"],
    ["atomic", "Atomic"],
    ["schess", "S-Chess"]
]

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

class SquareDelta_{
    constructor(x, y){
        this.x = x
        this.y = y
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
const SCHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[EHeh] w KQABCDEFGHkqabcdefgh - 0 1"

const WHITE = true
const BLACK = false

const ROOK_DIRECTIONS = [SquareDelta(1,0), SquareDelta(-1,0), SquareDelta(0,1), SquareDelta(0,-1) ]
const BISHOP_DIRECTIONS = [SquareDelta(1,1), SquareDelta(-1,-1), SquareDelta(1,-1), SquareDelta(-1,1) ]
const QUEEN_DIRECTIONS = ROOK_DIRECTIONS.concat(BISHOP_DIRECTIONS)
const KNIGHT_DIRECTIONS = [SquareDelta(2,1), SquareDelta(2,-1), SquareDelta(-2,1), SquareDelta(-2,-1), SquareDelta(1,2), SquareDelta(1,-2), SquareDelta(-1,2), SquareDelta(-1,-2) ]

const PIECE_DIRECTIONS = {
    r: [ROOK_DIRECTIONS, true],
    b: [BISHOP_DIRECTIONS, true],
    q: [QUEEN_DIRECTIONS, true],
    k: [QUEEN_DIRECTIONS, false],
    n: [KNIGHT_DIRECTIONS, false],
}

let ADJACENT_DIRECTIONS = []
for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if((i!=0)||(j!=0))ADJACENT_DIRECTIONS.push(SquareDelta(i,j))

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
    [ "schess", "S-Chess", SCHESS_START_FEN ],
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
    constructor(kind, color){
        this.kind = kind
        this.color = color
    }

    isempty(){
        return !this.kind
    }

    toString(){
        if(this.isempty()) return "-"
        if(!this.color) return this.kind
        return this.kind.toUpperCase()
    }

    tocolor(color){
        return Piece(this.kind, color)
    }

    inverse(){
        return this.tocolor(!this.color)
    }

    equalto(p){
        return ( ( this.kind == p.kind ) && ( this.color == p.color ) )
    }

    clone(){
        return Piece(this.kind, this.color)
    }
}
function Piece(kind, color){return new Piece_(kind, color)}
function PieceL(letter){
    if(letter == letter.toLowerCase()) return new Piece_(letter, BLACK)
    return new Piece_(letter.toLowerCase(), WHITE)
}

class Move_{
    constructor(fromsq, tosq, prompiece, epclsq, epsq){
        this.fromsq = fromsq
        this.tosq = tosq
        this.prompiece = prompiece
        this.epclsq = epclsq
        this.epsq = epsq
    }

    roughlyequalto(move){
        return this.fromsq.equalto(move.fromsq) && this.tosq.equalto(move.tosq)
    }
}
function Move(fromsq, tosq, prompiece, epclsq, epsq){return new Move_(fromsq, tosq, prompiece, epclsq, epsq)}

class ChessBoard_{
    constructor(props){        
        this.props = props || {}

        this.variant = this.props.variant || DEFAULT_VARIANT
        
        this.rep = Array(BOARD_AREA).fill(null)    

        this.stack = []

        this.setfromfen()
    }

    IS_ATOMIC(){
        return this.variant == "atomic"
    }

    IS_ANTICHESS(){
        return this.variant == "antichess"
    }

    IS_SCHESS(){
        return this.variant == "schess"
    }

    pieceStore(){
        if(!this.piecestorefen) return []
        return this.piecestorefen.split("").map(letter => PieceL(letter))
    }

    squareStore(){
        if(!this.castlefen == "-") return []

        return this.castlefen.split("")
            .filter(letter => (letter != "K") && (letter != "Q") && (letter != "k") && (letter != "q"))
            .map(letter => {
                let lower = letter.toLowerCase()
                let color = letter == lower ? BLACK : WHITE
                let file = lower.charCodeAt(0) - "a".charCodeAt(0)
                let rank = baseRank(color)                
                return Square(file, rank)
            })
    }

    pieceStoreColor(color){
        return this.pieceStore().filter(p => p.color == color)
    }

    adjacentsquares(sq){
        return ADJACENT_DIRECTIONS.map((dir)=>sq.adddelta(dir)).filter((sq)=>this.squareok(sq))
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
            for(let c of Array.from(rankfen)){
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
                    this.rep[i++] = Piece(kind, color)
                }
            }
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

    movetoalgeb(move){
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

        return `${this.squaretoalgeb(move.fromsq)}${this.squaretoalgeb(move.tosq)}${move.prompiece ? move.prompiece.kind : ''}`
    }

    squaretorepindex(sq){
        return sq.file + sq.rank * NUM_SQUARES
    }

    setpieaceatsquare(sq, p){
        this.rep[this.squaretorepindex(sq)] = p
    }

    attacksonsquarebypiece(sq, p){                        
        let plms = this.pseudolegalmovesforpieceatsquare(p.inverse(), sq)        
        return plms.filter((move)=>this.pieceatsquare(move.tosq).equalto(p))
    }

    issquareattackedbycolor(sq, color){
        for(let pl of ['q', 'r', 'b', 'n', 'k']){
            if(this.attacksonsquarebypiece(sq, Piece(pl, color)).length > 0) return true
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

    iskingincheck(color){
        let wk = this.whereisking(color)        
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
        return true
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
        this.piecestorefen = state.piecestorefen        

        this.fen = state.fen
    }

    pop(){
        this.setstate(this.stack.pop())
    }

    algebtomove(algeb){
        let lms = this.legalmovesforallpieces()

        return lms.find(move => this.movetoalgeb(move) == algeb)
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
            this.removeSquareFromStore(move.fromsq)
        }

        if(move.prompiece){            
            this.setpieaceatsquare(move.tosq, this.turn ? move.prompiece.tocolor(WHITE) : move.prompiece)
        }else{            
            this.setpieaceatsquare(move.tosq, fromp)
        }   

        if(move.epclsq){            
            this.setpieaceatsquare(move.epclsq, Piece())
        }

        if(move.castling){
            this.setpieaceatsquare(move.delrooksq, Piece())
            this.setpieaceatsquare(move.putrooksq, Piece('r', this.turn))
        }

        // set castling rights

        if(fromp.kind == "k"){
            this.deletecastlingrights("kq", this.turn)
        }

        for(let side of ["k", "q"]){
            let rosq = this.rookorigsq(side, this.turn)
            let rop = this.pieceatsquare(rosq)
            if(!rop.equalto(Piece('r', this.turn))) this.deletecastlingrights(side, this.turn)
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

            for(let sq of move.passingSquares) this.removeSquareFromStore(sq)
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
    }

    squareok(sq){
        return ( sq.file >= 0 ) && ( sq.rank >= 0 ) && ( sq.file < NUM_SQUARES ) && ( sq.rank < NUM_SQUARES)
    }

    promkinds(){        
        let pks = ["q", "r", "b", "n"]
        if(this.IS_ANTICHESS()) return pks.concat(["k"])        
        if(this.IS_SCHESS()){
            pks = pks.concat(["e", "h"])
        }
        return pks
    }

    pseudolegalmovesforpieceatsquare(p, sq){                        
        let acc = this.pseudolegalmovesforpieceatsquareinner(p, sq)

        let pstore = this.pieceStoreColor(p.color)
        
        if(this.IS_SCHESS()){
            if(
                (sq.rank == baseRank(p.color))
                && (p.kind != "e")
                && (p.kind != "h")
                //&& this.squareStore().find(tsq => tsq.equalto(sq))
            ){
                for(let psp of pstore){
                    acc = acc.concat(this.pseudolegalmovesforpieceatsquareinner(p, sq).map(psm => {                        
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

        return acc
    }

    pseudolegalmovesforpieceatsquareinner(p, sq){
        if(p.kind == "e"){
            let acc = this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("r", p.color), sq)
            acc = acc.concat(this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("n", p.color), sq))
            return acc
        }

        if(p.kind == "h"){
            let acc = this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("b", p.color), sq)
            acc = acc.concat(this.pseudolegalmovesforpieceatsquareinnerpartial(Piece("n", p.color), sq))
            return acc
        }

        return this.pseudolegalmovesforpieceatsquareinnerpartial(p, sq)
    }

    pseudolegalmovesforpieceatsquareinnerpartial(p, sq){                        
        let dirobj = PIECE_DIRECTIONS[p.kind]
        let plms = []                
        if(dirobj){
            for(let dir of dirobj[0]){                
                var ok
                var currentsq = sq                
                do{                    
                    currentsq = currentsq.adddelta(dir)                    
                    ok = this.squareok(currentsq)                    
                    if(ok){
                        let tp = this.pieceatsquare(currentsq)                                                
                        if(tp.isempty()){                            
                            plms.push(Move(sq, currentsq))
                        }else if(tp.color != p.color){
                            plms.push(Move(sq, currentsq))
                            ok = false
                        }else{
                            ok = false
                        }
                    }
                }while(ok && dirobj[1])
            }
        }else if(p.kind == "p"){
            let pdirobj = PAWNDIRS(p.color)
            let pushonesq = sq.adddelta(pdirobj.pushone)
            let pushoneempty = this.pieceatsquare(pushonesq).isempty()
            if(pushoneempty){
                if(pushonesq.rank == pdirobj.promrank){                    
                    for(let kind of this.promkinds()){                        
                        plms.push(Move(sq, pushonesq, Piece(kind, BLACK)))    
                    }
                }else{
                    plms.push(Move(sq, pushonesq))
                }                
            }
            if(sq.rank == pdirobj.baserank){
                if(pushoneempty){
                    let pushtwosq = sq.adddelta(pdirobj.pushtwo)
                    if(this.pieceatsquare(pushtwosq).isempty()){                        
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
                            for(let kind of this.promkinds()){
                                plms.push(Move(sq, captsq, Piece(kind, BLACK)))    
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
        return lms
    }

    ismovecapture(move){
        if(move.epclsq) return true
        let top = this.pieceatsquare(move.tosq)
        return(!top.isempty())        
    }

    santomove(san){
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
        let prom = move.prompiece ? "=" + move.prompiece.kind.toUpperCase() : ""        
        let place = move.placePiece ? "/" + move.placePiece.kind.toUpperCase() : ""

        if(fromp.kind == "p"){
            return capt ? fromalgeb[0] + "x" + toalgeb + place + prom + check : toalgeb + place + prom + check
        }

        let qualifier = ""                
        let attacks = this.attacksonsquarebypiece(move.tosq, fromp)        
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
        return capt ? letter + qualifier + "x" + toalgeb + check : letter + qualifier + toalgeb + place + prom + check
    }

    squarefromalgeb(algeb){        
        let file = algeb.charCodeAt(0) - "a".charCodeAt(0)
        let rank = NUM_SQUARES - 1 - ( algeb.charCodeAt(1) - "1".charCodeAt(0) )
        return Square(file, rank)
    }

    movefromalgeb(algeb){
        if(algeb.includes("@")){
            let sq = this.squarefromalgeb(algeb.slice(2,4))
            let p = new Piece(algeb.slice(0,1).toLowerCase(), this.turnfen == "w")
            return new Move(sq, sq, p)    
        }        
        return new Move(this.squarefromalgeb(algeb.slice(0,2)), this.squarefromalgeb(algeb.slice(2,4)))
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

class GameNode_{
    constructor(){        
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

class Game_{
    constructor(propsopt){        
        let props = propsopt || {}

        this.variant = props.variant || DEFAULT_VARIANT
        this.flip = props.flip || false

        this.pgnHeaders = OrderedHash()
        this.pgnBody = ""

        this.board = ChessBoard()
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

    fromblob(blob){
        this.variant = blob.variant
        this.flip = blob.flip
        let gamenodesserialized = blob.gamenodes || {}
        this.gamenodes = {}
        for(let id in gamenodesserialized){
            this.gamenodes[id] = GameNode().fromblob(this, gamenodesserialized[id])
        }
        this.currentnodeid = blob.currentnodeid || "root"
        this.board.setfromfen(this.getcurrentnode().fen, this.variant)
        this.animations = blob.animations || []
        this.selectedAnimation = blob.selectedAnimation
        this.animationDescriptors = blob.animationDescriptors || {}
        this.pgnHeaders = OrderedHash(blob.pgnHeaders)
        this.pgnBody = blob.pgnBody || "*"
        this.setDefaultPgnHeaders()
        return this
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
            pgnBody: this.pgnBody
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
            this.analyzedboard.pushalgeb(algeb)
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

      this.sortedpvs = Object.keys(this.pvs).sort((a, b)=>this.pvs[b].scorenumerical - this.pvs[a].scorenumerical)                                

      if(this.sortedpvs.length >= this.multipv){
        let mindepth = null
        for(let move of this.sortedpvs.slice(0, this.multipv)){            
          let currentdepth = this.pvs[move].depth
          if(mindepth === null) mindepth = currentdepth
          else if(currentdepth < mindepth) mindepth = currentdepth
        }
        this.completeddepth = mindepth          
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

        if(VERBOSE) console.log(summary)

        this.analysisinfo.lastcompleteddepth = this.lastcompleteddepth
        this.analysisinfo.summary = summary
        
        if(this.analysisinfo.lastcompleteddepth >= ( this.minDepth ? this.minDepth : 0 ) ){
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

  constructor(sendanalysisinfo){      
      this.sendanalysisinfo = sendanalysisinfo

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
            let detailedmove = this.lms.find((m)=>this.board.movetoalgeb(m) == item.uci)
            if(detailedmove){
                item.san = this.board.movetosan(detailedmove)                
                item.detailedmove = detailedmove                                
            }
        }
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
    module.exports.AbstractEngine = AbstractEngine
}

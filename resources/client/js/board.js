const RICH = true

const DEFAULT_SQUARESIZE = 57.5

class Board_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.squaresize = this.props.squaresize || DEFAULT_SQUARESIZE

        this.squareopacity = this.props.squareopacity || 0.3

        this.positionchangedcallback = this.props.positionchangedcallback

        this.parentApp = this.props.parentApp

        this.game = Game({variant: this.props.variant || DEFAULT_VARIANT}).setfromfen()        

        this.canvasnames = [
            "background",
            "square",
            "highlight",            
            "weights",
            "showanalysis",
            "analysis",
            "drawings",            
            "piece",
            "dragpiece",
            "gif"
        ]
    }

    positionWheeled(ev){
        ev.preventDefault()
        if(ev.wheelDelta < 0) this.back()
        if(ev.wheelDelta > 0) this.forward()
    }

    init(){
        this.x()

        this.canvases = this.canvasnames.map(cn =>
            Canvas({width: this.boardsize(), height: this.boardsize()}).poa()
        )

        this.ae("wheel", this.positionWheeled.bind(this))

        this.a(
            div().w(this.boardsize()).h(this.boardsize()).por().a(
                this.canvases,
                div({ev: "dragstart mousemove mouseup", do: "dragpiece"}).w(this.boardsize()).h(this.boardsize()).poa().drgb()
            )            
        )

        this.draw()
    }

    reset(variant){
        this.game.reset(variant)
        return this.setgame(this.game)
    }

    coordstosq(coords){return this.fasq(Square(Math.floor(coords.x / this.squaresize), Math.floor(coords.y / this.squaresize)))}

    clearPiece(sq){                    
        this.getCanvasByName("piece").clearRect(this.piececoords(sq), Vect(this.piecesize(), this.piecesize()))        
    }

    getlms(RICH, decorate){
        let lms = this.game.board.legalmovesforallpieces()

        if(RICH) lms.forEach(lm => {
            lm.san = this.game.board.movetosan(lm)
            lm.gameNode = this.getcurrentnode().sortedchilds().find(child => child.gensan == lm.san)
            lm.evalWeight = 100000
            lm.hasEval = false
            if(lm.gameNode) if(lm.gameNode.hasEval){
                lm.hasEval = true
                lm.evalWeight -= lm.gameNode.eval
            }
            lm.gameMove = lm.gameNode ? 1 : 0
            lm.weights = lm.gameNode ? lm.gameNode.weights : [0, 0]
            lm.sortweight = lm.gameNode ? 1e6 + 1000 * ( lm.gameNode.sortweight() + 1 ) : 0            
        })

        if(decorate) lms.forEach(lm => {
            lm.decorate = decorate.moves.find(move => move.san == lm.san)            
            if(lm.decorate){
                lm.decorate.total = lm.decorate.white + lm.decorate.draws + lm.decorate.black
                lm.decorate.perf = lm.decorate.white + 0.5 * lm.decorate.draws
                lm.decorate.perfpercent = Math.round(lm.decorate.perf / lm.decorate.total * 100)
                if(!this.game.board.turn) lm.decorate.perfpercent = 100 - lm.decorate.perfpercent
                if(!lm.hasEval) lm.sortweight += 100 + 100 * lm.decorate.total / ( decorate.white + decorate.draws + decorate.black )
            }
        })

        return lms
    }

    makeMove(move){
        this.game.makemove(move)
        this.positionchanged()
    }

    handleEvent(sev){
        if(sev.do == "dragpiece"){
            switch(sev.kind){
                case "dragstart":
                    sev.ev.preventDefault()                        
                    let bcr = this.getCanvasByName("dragpiece").e.getBoundingClientRect()
                    this.piecedragorig = Vect(sev.ev.clientX - bcr.x, sev.ev.clientY - bcr.y)        
                    this.draggedsq = this.coordstosq(this.piecedragorig)        
                    this.draggedpiece = this.game.board.pieceatsquare(this.draggedsq)
                    if(!this.draggedpiece.isempty()){
                        this.draggedpiececoords = this.piececoords(this.draggedsq)        
                        this.clearPiece(this.draggedsq)
                        this.piecedragon = true            
                    }        
                    break
                case "mousemove":
                    if(this.piecedragon){
                        let bcr = this.getCanvasByName("dragpiece").e.getBoundingClientRect()
                        this.piecedragvect = Vect(sev.ev.clientX - bcr.x, sev.ev.clientY - bcr.y)
                        this.piecedragdiff = this.piecedragvect.m(this.piecedragorig)
                        this.dragtargetsq = this.coordstosq(this.piecedragvect)            
                        
                        let dragpiececanvas = this.getCanvasByName("dragpiece")
                        dragpiececanvas.clear()
                        this.drawPiece(dragpiececanvas, this.draggedpiececoords.p(this.piecedragdiff), this.draggedpiece)
                    }
                    break
                case "mouseup":
                    if(this.piecedragon){
                        this.piecedragon = false

                        let dragpiececanvas = this.getCanvasByName("dragpiece")

                        dragpiececanvas.clear()            

                        this.drawPiece(dragpiececanvas, this.piececoords(this.fasq(this.dragtargetsq)), this.draggedpiece)
            
                        let move = Move(this.draggedsq, this.dragtargetsq)
                        
                        let valid = this.getlms().find((testmove) => testmove.roughlyequalto(move))

                        if(valid) if(valid.prompiece){
                            let promkind = window.prompt("Promote piece, q = Queen, r = Rook, b = Bishop, n = Knight [ Enter / Ok = Queen ] : ")
                            promkind = promkind || "q"
                            if(!promotionKindsForVariant(this.game.variant).includes(promkind)) promkind = "q"
                            valid.prompiece = Piece(promkind, valid.prompiece.color)
                        }

                        if(valid){
                            if(this.parentApp.trainMode == this.game.board.turnVerbal){
                                let candidates = this.getcurrentnode().sortedchilds().filter(child => child.weights[0])
                                if(candidates.length == 0){
                                    return this.parentApp.trainingLineCompleted()
                                }else{
                                    if(candidates.find(cand => cand.gensan == this.game.board.movetosan(valid))){
                                        this.makeMove(valid)
                                    }else{
                                        this.parentApp.alert("Wrong move", "error")
                                        this.forceWeights = true
                                        this.draw()
                                    }
                                }
                            }else{
                                this.makeMove(valid)
                            }                            
                        }else{
                            this.draw()
                        }                        
                    }
                    break
            }
        }
    }

    positionchanged(){
        this.draw()

        if(this.positionchangedcallback) this.positionchangedcallback()
    }

    doflip(){
        this.game.flip = !this.game.flip        
        this.positionchanged()
    }

    fasq(sq){
        if(this.game.flip) return Square(LAST_SQUARE - sq.file, LAST_SQUARE - sq.rank)
        return sq
    }

    boardsize(){
        return this.squaresize * NUM_SQUARES
    }

    setgame(game){
        this.game = game        
        this.positionchanged()
        this.parentApp.pgnHeadersEditableList.fromOrderedHash(this.game.pgnHeaders)
        return this
    }

    squarelight(sq){return ( ( sq.file + sq.rank ) % 2 ) == 0}

    piecemargin(){return ( this.squaresize - this.piecesize() ) / 2}

    squarecoords(sq){
        return Vect(sq.file * this.squaresize, sq.rank * this.squaresize)
    }

    piececoords(sq){
        let sc = this.squarecoords(this.fasq(sq))
        return Vect(sc.x + this.piecemargin(), sc.y + this.piecemargin())
    }

    getCanvasByName(name){
        return this.canvases[this.canvasnames.findIndex(canvasName => name == canvasName)]
    }

    drawSquares(){        
        let backgroundcanvas = this.getCanvasByName("background")

        backgroundcanvas.loadBackgroundImage(`resources/client/img/backgrounds/${getLocal("app/maintabpane/boardBackgroundCombo", {selected: "wood.jpg"}).selected}`, Vect(this.boardsize(), this.boardsize()))

        let squarecanvas = this.getCanvasByName("square").op(this.squareopacity)
        
        for(let sq of ALL_SQUARES){
            squarecanvas.fillStyle(this.squarelight(sq) ? "#eed" : "#aab")
            let sqcoords = this.squarecoords(sq)
            squarecanvas.fillRect(sqcoords, Vect(this.squaresize, this.squaresize))
        }        
    }

    piecesize(){return this.squaresize * 0.85}

    drawPiece(canvas, coords, p){                
        const klasssel = "." + getclassforpiece(p, this.piecestyle)                                                    
        let img
        if(!this.imgcache) this.imgcache = {}
        if(this.imgcache[klasssel]){
            img = this.imgcache[klasssel]
            canvas.ctx.drawImage(img.e, coords.x, coords.y, this.piecesize(), this.piecesize())
        }else{
            let style = getStyle(klasssel)            
            let imgurl = style.match(/url\("(.*?)"/)[1]                
            let imgurlparts = imgurl.split(",")
            let svgb64 = imgurlparts[1]
            let svg = atob(svgb64)
            let newsvg = svg.replace(/^<svg/, `<svg width="${this.piecesize()}" height="${this.piecesize()}"`)
            let newsvgb64 = btoa(newsvg)
            let newimgurl = imgurlparts[0] + "," + newsvgb64            
            let img = Img({width: this.piecesize(), height: this.piecesize()})                            
            let fen = this.game.fen()
            img.e.onload = () => {
                if(this.game.fen() == fen){
                    canvas.ctx.drawImage(img.e, coords.x, coords.y, this.piecesize(), this.piecesize())
                }                
                this.imgcache[klasssel] = img                
            }
            img.e.src = newimgurl                                                        
        }   
    }

    drawPieces(){                        
        let piececanvas = this.getCanvasByName("piece")
        piececanvas.clear()
        for(let sq of ALL_SQUARES){
            let p = this.game.board.pieceatsquare(sq)
            if(!p.isempty()){                
                let pc = this.piececoords(sq)
                this.drawPiece(piececanvas, pc, p)
            }
        }
    }

    arrowscalefactor(){
        return this.boardsize() / 560
    }

    drawmovearrow(canvas, move, argsopt){
        canvas.arrow(
            this.squaremiddlecoords(move.fromsq),
            this.squaremiddlecoords(move.tosq),
            argsopt
        )
    }

    clearanalysisinfo(){
        if(this.analysisinfoDiv) this.analysisinfoDiv.x()
        let analysiscanvas = this.getCanvasByName("analysis")
        analysiscanvas.clear()
        let sac = this.getCanvasByName("showanalysis")
        sac.clear()
        return analysiscanvas
    }

    squaremiddlecoords(sq){
        return Vect(this.fasq(sq).file, this.fasq(sq).rank).s(this.squaresize).p(Vect(this.squaresize/2, this.squaresize/2))
    }

    analysiskey(){        
        return `analysis/${this.game.variant}/${strippedfen(this.getcurrentnode().fen)}`
    }

    getcurrentnode(){
        return this.game.getcurrentnode()
    }
    
    createAnalysisInfoItemMove(item, lastcompleteddepth){
        return div().bdrs("solid").bdrw(this.getcurrentnode().hasSan(item.san) ? 2 : 0)
            .mar(1).pad(1).dfc()
            .c(scoretorgb(item.scorenumerical))
            .a(
                div()
                    .pad(1).w(80)
                    .html(item.san).fs(26).fwb().cp()
                    .ae("mousedown", this.idParent().moveClicked.bind(this.idParent(), item.detailedmove)),
                div()
                    .pad(1).w(100).cp()                    
                    .html(`${item.scorenumerical}`).fs(22).fwb()
                    .ae("mousedown", this.idParent().addLegalMove.bind(this.idParent(), item.detailedmove, 0)),
                div()
                    .c("#00a").fwb().cp()
                    .html(`${lastcompleteddepth}`)
                    .ae("mousedown", this.idParent().addLegalMove.bind(this.idParent(), item.detailedmove, 1)),
            )
    }

    createAnalysisInfoItemLine(item){
        return div()
            .w(2000).dfc().flwn()
            .marl(10).ffm().fs(14)
            .a(
                item.pvsans.slice(1).map(san =>
                    div()
                        .c("#33a").bc("#ddd")
                        .marr(8).html(san)
                )
            )
    }

    createAnalysisInfoItem(item, lastcompleteddepth){
        return div()
            .marl(5)
            .a(
                this.createAnalysisInfoItemMove(item, lastcompleteddepth),
                this.createAnalysisInfoItemLine(item),
            )
    }

    createAnalysisInfoSummary(richanalysisinfo){
        let items = richanalysisinfo.analysisinfo.summary.map(item =>
            this.createAnalysisInfoItem(item, richanalysisinfo.analysisinfo.lastcompleteddepth))
        return div().a(
            Button("Minimax", this.parentApp.minimax.bind(this.parentApp, false)).marl(10).w(130).padl(20).padr(20).mart(2).acs("button green"),
            Button("Unminimax", this.parentApp.clearMinimax.bind(this.parentApp, true)).marl(5).mart(2).acs("button red"),
            items
        )
    }

    highlightrichanalysisinfo(richanalysisinfo){        
        let analysisinfo = richanalysisinfo.analysisinfo        
        let analysiscanvas = this.clearanalysisinfo()        
        if(this.parentApp.trainOn) return
        if(analysisinfo.analysiskey != this.analysiskey()) return
        let i = analysisinfo.summary.length        
        for(let item of analysisinfo.summary.slice().reverse()){
            this.drawmovearrow(analysiscanvas, item.move, {
                scalefactor: this.arrowscalefactor(),
                auxscalefactor: 1/i--,
                color: scoretorgb(item.scorenumerical)
            })      
        }

        try{
            if(this.parentApp.settings.showAnalysisInBoardCheckbox.checked && this.parentApp.shouldGo){                    
                let sac = this.getCanvasByName("showanalysis")

                sac.setFont(`${this.squaresize * 3}px serif`)

                let scorenumerical = analysisinfo.summary[0].scorenumerical

                sac.ctx.globalAlpha = 0.5

                sac.fillStyle(scoretorgb(scorenumerical))                
                
                sac.fillText(`${scorenumerical > 0 ? "+" + scorenumerical : scorenumerical}`, Vect(this.boardsize()/16, this.boardsize()/2))

                sac.setFont(`${this.squaresize * 2}px serif`)

                sac.fillStyle("#0000FF")                

                sac.fillText(`${analysisinfo.lastcompleteddepth}`, Vect(0.6 * this.boardsize(), 0.8 * this.boardsize()))
            }
        }catch(err){}

        if(this.analysisinfoDiv){
            this.analysisinfoDiv
            .bc(richanalysisinfo.isLive ? "#afa" : "#eee")
            .a(                
                this.createAnalysisInfoSummary(richanalysisinfo),
                richanalysisinfo.isLive ? div() :
                    Button("Delete", this.idParent().deleteAnalysis.bind(this.idParent()))
                        .mart(20).marl(180).bc(RED_BUTTON_COLOR),
            )
        }
    }

    createCommentCanvas(){
        let bs = this.boardsize()

        this.commentcanvas = Canvas({width: bs, height: bs})

        this.commentcanvas.ctx.globalAlpha = 1

        this.commentcanvas.ctx.textBaseline = "top"
        this.commentcanvas.ctx.fillStyle = "#000000"

        this.commentfontsize = bs / 12
        this.commentmargin = this.commentfontsize / 3

        this.commentcanvas.ctx.font = `${this.commentfontsize}px serif`

        let message = this.getcurrentnode().comment.split("#")[0]
        if(message) this.commentcanvas.renderText(message, bs - 2 * this.commentmargin, this.commentfontsize * 1.1, this.commentmargin, this.commentmargin)
    }

    highlightLastMove(){
        let currentnode = this.getcurrentnode()
        let highlightcanvas = this.getCanvasByName("highlight")
        highlightcanvas.clear()        
        if(currentnode.genalgeb){                        
            let move = this.game.board.movefromalgeb(currentnode.genalgeb)                        
            this.drawmovearrow(highlightcanvas, move, {
                scalefactor: this.arrowscalefactor()
            })
        }
    }

    highlightWeights(){
        let currentnode = this.getcurrentnode()
        let weightscanvas = this.getCanvasByName("weights")
        weightscanvas.clear()                
        if(this.parentApp.trainOn && (!this.forceWeights)) return
        this.forceWeights = false
        for(let child of currentnode.sortedchilds()){
            let move = this.game.board.movefromalgeb(child.genalgeb)
            this.drawmovearrow(weightscanvas, move, {
                scalefactor: this.arrowscalefactor(),
                auxscalefactor: 1.2,
                color: "#00f",
                opacity: child.weights[0] / 10
            })
        }
    }


    draw(){
        this.getCanvasByName("dragpiece").clear()

        this.drawSquares()

        this.highlightLastMove()

        this.highlightWeights()

        this.drawPieces()

        this.highlightDrawings()

        this.createCommentCanvas()
    }

    tobegin(){
        this.game.tobegin()
        this.positionchanged()
    }

    back(){
        this.game.back()
        this.positionchanged()
    }

    forward(){
        this.game.forward()
        this.positionchanged()
    }

    toend(){
        this.game.toend()
        this.positionchanged()
    }

    del(){
        this.game.del()
        this.positionchanged()
    }

    setfromnode(node){
        this.game.setfromnode(node)
        this.positionchanged()
    }

    calcdrawingstyle(r,g,b,o){
        return `rgb(${r},${g},${b},${(o+1)/10})` 
    }

    getdrawingcolor(drawing){
        return {
            red: this.calcdrawingstyle(255,0,0,drawing.opacity),
            green: this.calcdrawingstyle(0,127,0,drawing.opacity),
            blue: this.calcdrawingstyle(0,0,255,drawing.opacity),
            yellow: this.calcdrawingstyle(192,192,0,drawing.opacity)
        }[drawing.color]
    }

    calcdrawingsize(size){
        return size * this.squaresize / 60
    }

    highlightDrawings(){        
        let drawings = this.getcurrentnode().drawings()        
        let drawingscanvas = this.getCanvasByName("drawings")
        drawingscanvas.clear()
        let b = this.game.board
        for(let drawing of drawings){                     
            try{
                let squares = drawing.squares.map(algeb => this.fasq(b.algebtosquare(algeb)))
                switch(drawing.kind){
                    case "circle":                                        
                        for(let sq of squares){                            
                            let sqmc = this.squaremiddlecoords(sq)
                            drawingscanvas.lineWidth(this.calcdrawingsize(drawing.thickness))
                            drawingscanvas.strokeStyle(this.getdrawingcolor(drawing))
                            drawingscanvas.strokeCircle(sqmc, this.squaresize / 2.5)                            
                        }
                        break
                    case "arrow":
                        for(let i=0;i<squares.length/2;i++){
                            let move = Move(squares[i*2], squares[i*2+1])                                                        
                            this.drawmovearrow(drawingscanvas, move, {
                                color: this.getdrawingcolor(drawing),
                                auxscalefactor: drawing.thickness / 5
                            })
                        }
                        break
                    case "square":                                        
                        drawing.opacity /= 2
                        for(let sq of squares){
                            let sqc = this.squarecoords(sq)
                            drawingscanvas.fillStyle(this.getdrawingcolor(drawing))
                            drawingscanvas.fillRect(sqc.p(Vect(this.piecemargin(), this.piecemargin())), Vect(this.piecesize(), this.piecesize()))
                        }
                        break
                }
            }catch(err){
                console.log(err)
            }            
        }
    }
}
function Board(props){return new Board_(props)}

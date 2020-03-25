const THREE_PIECE_MODELS_PATH = "https://unpkg.com/@aestheticbookshelf/threejs3dchesspieces/lib"
const DEFAULT_BOARD_PATTERN_PATH = "resources/client/texture/board/board-pattern.png"

const DEFAULT_PIECE_ROTATION_X = Math.PI / 2
const DEFAULT_PIECE_ROTATION_Y = Math.PI / 2
const DEFAULT_PIECE_ROTATION_Z = 0

const THREE_BOARD_PIECE_NAMES = [
    "Pawn",
    "Knight",
    "Bishop",
    "Rook",
    "Queen",
    "King"
]

const THREE_PIECE_CACHE = {}

class ThreeBoard_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.board = ChessBoard()
        
        this.pieceStore = []

        this.drawingsStore = []

        this.ready = false

        this.mar(2).pad(2).ffm().html("ThreeBoard Loading Pieces ...")
    }

    createPiece(piece){
        let threePiece, plusKnight

        let tha = new ThreeAssembly()

        switch(piece.kind){
            case "p":
                threePiece = THREE_PIECE_CACHE["Pawn"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "n":
                threePiece = THREE_PIECE_CACHE["Knight"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "l":
                threePiece = THREE_PIECE_CACHE["Knight"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                let angle = 1.5*Math.PI-squareDeltaToAngle(piece.direction)                                
                tha.rotateOnAxis(new THREE.Vector3(0, 1, 0), angle)                            
                break
            case "b":
                threePiece = THREE_PIECE_CACHE["Bishop"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "r":
                threePiece = THREE_PIECE_CACHE["Rook"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "q":
                threePiece = THREE_PIECE_CACHE["Queen"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "k":
                threePiece = THREE_PIECE_CACHE["King"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece))
                break
            case "e":
                threePiece = THREE_PIECE_CACHE["Rook"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece, new THREE.Vector3(
                    -this.BOARD_GRID_SIZE*0.25,
                    -this.BOARD_GRID_SIZE*0.25,
                    0
                )))
                plusKnight = THREE_PIECE_CACHE["Knight"].clone()
                plusKnight.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(plusKnight, new THREE.Vector3(
                    this.BOARD_GRID_SIZE*0.25,
                    this.BOARD_GRID_SIZE*0.25,
                    0
                )))
                break
            case "h":
                threePiece = THREE_PIECE_CACHE["Bishop"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(threePiece, new THREE.Vector3(
                    -this.BOARD_GRID_SIZE*0.25,
                    -this.BOARD_GRID_SIZE*0.25,
                    0
                )))
                plusKnight = THREE_PIECE_CACHE["Knight"].clone()
                plusKnight.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                tha.add(new ThreeAssemblyItem(plusKnight, new THREE.Vector3(
                    this.BOARD_GRID_SIZE*0.25,
                    this.BOARD_GRID_SIZE*0.25,
                    0
                )))
                break
        }        

        threePiece.material = new THREE.MeshLambertMaterial({color: piece.color ? 0xffffff : 0x00ff00})                                
        if(plusKnight) plusKnight.material = new THREE.MeshLambertMaterial({color: piece.color ? 0xffffff : 0x00ff00})                                

        if(piece.kind != "l"){
            if(piece.color){
                tha.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI)            
            }else{
                tha.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI)            
            }
        }

        this.threeRenderer.addToGroup("pieces", tha)

        return tha
    }

    squareCoords(sq){
        return Vect(
            (sq.file - (NUM_SQUARES / 2)) * this.BOARD_GRID_SIZE,
            ((LAST_SQUARE - sq.rank) - (NUM_SQUARES / 2)) * this.BOARD_GRID_SIZE)
    }

    squareMiddleCoords(sq){
        return this.squareCoords(sq).p(Vect(this.BOARD_GRID_SIZE / 2, this.BOARD_GRID_SIZE / 2))
    }

    placePieceAtSquare(piece, sq, dx, dy, dz){
        let sqmcs = this.squareMiddleCoords(sq)
        piece.setOrigo(new THREE.Vector3(
            sqmcs.x + (dx || 0),
            sqmcs.y + (dy || 0),
            dz || this.BOARD_THICKNESS/2
        ))
    }

    drawPieces(){
        for(let sq of ALL_SQUARES){
            let p = this.board.pieceatsquare(sq)
            if(!p.isempty()){                
                let piece = this.createPiece(p)
                
                this.placePieceAtSquare(piece, sq)
            }
        }
    }

    intDegToRad(deg){
        return parseInt(deg) / 180 * Math.PI
    }

    highlightSquare(sq, group, colorOpt){
        let highlightsquaregeometry = new THREE.BoxGeometry(this.BOARD_GRID_SIZE*0.85, this.BOARD_GRID_SIZE*0.85, this.BOARD_THICKNESS/5)
        let highlightsquarematerial = new THREE.MeshBasicMaterial( {color: colorOpt || 0x00ffff} )
        highlightsquarematerial.transparent = true
        highlightsquarematerial.opacity = 0.5

        let highlightsquare = new THREE.Mesh(highlightsquaregeometry, highlightsquarematerial)        

        let sqmcs = this.squareMiddleCoords(sq)

        highlightsquare.position.x = sqmcs.x
        highlightsquare.position.y = sqmcs.y
        highlightsquare.position.z = this.BOARD_THICKNESS/2

        this.threeRenderer.addToGroup(group, highlightsquare)
    }

    drawMoveArrow(move, group){        
        let scmsfrom = this.squareMiddleCoords(move.fromsq)
        let scmsto = this.squareMiddleCoords(move.tosq)
        let vfrom = new THREE.Vector3(scmsfrom.x, scmsfrom.y, this.BOARD_THICKNESS/2)
        let vto = new THREE.Vector3(scmsto.x, scmsto.y, this.BOARD_THICKNESS/2)
        let vdiff = vto.clone().addScaledVector(vfrom, -1)
        let vdiffnorm = vdiff.clone().normalize()
        vdiff.addScaledVector(vdiffnorm, -this.BOARD_GRID_SIZE/2)
        let middle = vfrom.addScaledVector(vdiff, 0.5)
        let origdir = new THREE.Vector3(0,  vdiff.length(), 0)            

        let arrowbodygeometry = new THREE.BoxGeometry(this.BOARD_GRID_SIZE / 2, vdiff.length(), this.BOARD_THICKNESS/5)
        let arrowbodymaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} )
        arrowbodymaterial.transparent = true
        arrowbodymaterial.opacity = 0.5

        let arrowbody = new THREE.Mesh(arrowbodygeometry, arrowbodymaterial)

        let arrowheadgeometry = new THREE.BoxGeometry(this.BOARD_GRID_SIZE*0.85, this.BOARD_GRID_SIZE*0.85, this.BOARD_THICKNESS/5)
        let arrowheadmaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} )
        arrowheadmaterial.transparent = true
        arrowheadmaterial.opacity = 0.5

        let arrowhead = new THREE.Mesh(arrowheadgeometry, arrowheadmaterial)        

        let angle = origdir.angleTo(vdiff)
        
        arrowbody.position.copy(middle)                
        arrowbody.rotation.z = ( scmsfrom.x - scmsto.x ) > 0 ? angle : -angle

        arrowhead.position.copy(vto)                
        arrowhead.rotation.z = ( scmsfrom.x - scmsto.x ) > 0 ? angle : -angle

        this.threeRenderer.addToGroup(group, arrowbody)
        this.threeRenderer.addToGroup(group, arrowhead)
    }

    highlightLastMove(){        
        if(this.gameNode){            
            if(this.gameNode.gensan){                                
                let testboard = ChessBoard().setfromfen(this.gameNode.getparent().fen, this.board.variant)
                let move = testboard.santomove(this.gameNode.gensan)
                if(move){
                    this.drawMoveArrow(move, "highlightlastmove")
                }
            }
        }
    }

    clearSquareHighlight(){
        this.threeRenderer.removeGroup("squarehighlight")                
    }

    clearInitialSquareHighlight(){
        this.threeRenderer.removeGroup("initialsquarehighlight")        
        this.initialSquare = null
    }

    clearInitialSquareHighlightRender(){
        this.clearInitialSquareHighlight()
        this.threeRenderer.render()
    }

    clearSquareHighlightRender(){
        this.clearSquareHighlight()        
        this.clearInitialSquareHighlight()
        this.threeRenderer.render()
    }

    draw(){
        try{
            this.clearSquareHighlight()
            this.clearInitialSquareHighlight()

            this.threeRenderer.removeGroup("highlightlastmove")
            this.highlightLastMove()

            this.threeRenderer.removeGroup("pieces")
            this.drawPieces()            

            this.threeRenderer.scene.rotation.x = -0.5 * this.intDegToRad(this.settings.rotXCombo.selected)        
            this.threeRenderer.scene.rotation.z = ( this.flip ? Math.PI : 0 ) + this.intDegToRad(this.settings.rotZCombo.selected)        

            this.threeRenderer.render()

            this.ready = true

            if(this.props.drawOkCallback) this.props.drawOkCallback()
        }catch(err){console.log("draw 3d error", err)}
    }

    setFromFen(fen, variant){
        this.board.setfromfen(fen, variant)

        this.draw()
    }

    setFromGame(game){
        this.flip = game.flip

        this.gameNode = game.getcurrentnode()

        this.setFromFen(game.fen(), game.variant)
    }

    init(){
        this.loadPieces()
    }

    get scale(){
        return this.props.scale || 1
    }

    handleMouseMove(ev){        
        let bcr = this.mouseHandlerDiv.e.getBoundingClientRect()
        let npv = Vect(
            (ev.clientX - bcr.x)/this.threeRenderer.RENDERER_WIDTH*2-1,
            -((ev.clientY - bcr.y)/this.threeRenderer.RENDERER_HEIGHT*2-1)
        )
        let mindiff = null
        let selsq = null
        for(let sq of ALL_SQUARES){
            let v = this.squareMiddleCoords(sq)
            let v3 = new THREE.Vector3(v.x, v.y, this.BOARD_THICKNESS)
            let rot = this.threeRenderer.scene.rotation
            v3.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.flip ? -rot.x : rot.x)
            v3.applyAxisAngle(new THREE.Vector3(0, 0, 1), rot.z)
            v3.project(this.threeRenderer.camera)            
            let vsq = Vect(v3.x, v3.y)
            let diff = vsq.m(npv).l()
            if(mindiff === null){
                mindiff = diff
                selsq = sq
            }
            if(diff < mindiff){
                mindiff = diff
                selsq = sq
            }
        }
        if(!selsq.equalto(this.prevselsq)){
            this.clearSquareHighlight()
            this.highlightSquare(selsq, "squarehighlight")
            this.threeRenderer.render()        
        }
        this.prevselsq = selsq
        if(ev.type == "click"){
            if(this.initialSquare){
                let move = Move(this.initialSquare, selsq)
                this.clearInitialSquareHighlightRender()
                if(selsq.equalto(this.initialSquare)){
                    this.clearInitialSquareHighlightRender()
                }else{
                    let lms = this.board.legalmovesforallpieces()                    
                    let valid = lms.find((testmove) => testmove.roughlyequalto(move))                    
                    if(valid) if(this.props.moveCallback) this.props.moveCallback(move)
                }
            }else{                
                this.clearSquareHighlight()
                this.initialSquare = selsq
                this.highlightSquare(this.initialSquare, "initialsquarehighlight", 0xff00ff0)
                this.threeRenderer.render()        
            }
        }
    }

    initRenderer(){
        this.html("ThreeBoard Initializing Renderer ...")

        this.THREE_WIDTH = 460
        this.THREE_HEIGHT = 460

        this.PIECE_SCALE = ( this.THREE_HEIGHT + this.THREE_WIDTH ) / 70000 * this.scale

        this.threeRenderer = ThreeRenderer({
            RENDERER_WIDTH: this.THREE_WIDTH,
            RENDERER_HEIGHT: this.THREE_HEIGHT
        })

        this.threeRenderer.camera.position.z = 2

        this.BOARD_GRID_SIZE = ( this.THREE_WIDTH + this.THREE_HEIGHT ) / 4000 * this.scale
        
        this.textureLoader = new THREE.TextureLoader()

        this.textureLoader.load(
            DEFAULT_BOARD_PATTERN_PATH,
            texture => {
                let boardTexture = texture

                boardTexture.repeat.set(4,4)
                boardTexture.wrapS = THREE.RepeatWrapping
                boardTexture.wrapT = THREE.RepeatWrapping

                let boardMaterials = [

                    new THREE.MeshLambertMaterial({color: 0x555555}),
                    new THREE.MeshLambertMaterial({color: 0x555555}),
                    new THREE.MeshLambertMaterial({color: 0x555555}),
                    new THREE.MeshLambertMaterial({color: 0x555555}),
                    new THREE.MeshLambertMaterial({ map: boardTexture }),
                    new THREE.MeshLambertMaterial({color: 0x555555})

                ]

                this.BOARD_THICKNESS = ( this.THREE_HEIGHT + this.THREE_WIDTH ) / 8000 * this.scale

                let geometry = new THREE.BoxGeometry(
                    this.THREE_WIDTH / 250 * this.scale,
                    this.THREE_HEIGHT / 250 * this.scale,
                    this.BOARD_THICKNESS
                )

                let threeBoard = new THREE.Mesh(geometry, boardMaterials)

                this.threeRenderer.scene.add(threeBoard)

                this.x().por().ame(
                    this.canvasHook = div().poa(),
                    this.mouseHandlerDiv = div().poa()
                        .w(this.threeRenderer.RENDERER_WIDTH).h(this.threeRenderer.RENDERER_HEIGHT)
                        .ae("mousemove click", this.handleMouseMove.bind(this))
                        .ae("mouseout", this.clearSquareHighlightRender.bind(this)),
                    div().bc("#ccc").pad(1).mar(1).poa().easeOnOut().a(
                        Labeled("&nbsp;Rot X (deg) ", IncCombo({                    
                            id: "rotXCombo",                    
                            display: "Rot X (deg)",                                        
                            options: Array(19).fill(null).map((_, i) => ({value: i*5, display: i*5})),
                            selected: 50,
                            settings: this.settings,
                            changeCallback: this.draw.bind(this)
                        })).bc("#eee"),
                        Labeled("&nbsp;Rot Z (deg) ", IncCombo({                    
                            id: "rotZCombo",                    
                            display: "Rot Z (deg)",                                        
                            options: Array(19).fill(null).map((_, i) => ({value: (i-9)*5, display: (i-9)*5})),
                            selected: 0,
                            settings: this.settings,
                            changeCallback: this.draw.bind(this)
                        })).bc("#eee").marl(3)
                    ),                    
                )

                this.canvasHook.e.appendChild(this.threeRenderer.renderer.domElement)

                this.setFromFen(this.props.setFen, this.props.setVariant)
            },
            undefined,
            err => {
                this.html("ThreeBoard Error : Loading Texture Failed ...")
                return
            }
        )        
    }

    loadPieces(){        
        // determine pieces not already cached
        let missingPieces = THREE_BOARD_PIECE_NAMES.filter(name => !THREE_PIECE_CACHE[name])

        let numMissingPieces = missingPieces.length

        if(numMissingPieces){
            // load missing pieces
            let numLoadedPieces = 0

            for(let threePieceKind of missingPieces)
            IDB.loadThreeObject(THREE_PIECE_MODELS_PATH + "/" + threePieceKind + ".obj").then(object => {
                object.traverse( child => {        
                    if (child instanceof THREE.Mesh) {                       
                        child.rotation.x = DEFAULT_PIECE_ROTATION_X
                        child.rotation.y = DEFAULT_PIECE_ROTATION_Y
                        child.rotation.z = DEFAULT_PIECE_ROTATION_Z

                        THREE_PIECE_CACHE[threePieceKind] = child

                        numLoadedPieces++

                        if(numLoadedPieces == numMissingPieces){
                            this.initRenderer()
                        }
                    }
                })
            })
        }else{
            this.initRenderer()
        }
    }
}
function ThreeBoard(props){return new ThreeBoard_(props)}

const THREE_PIECE_MODELS_PATH = "/resources/client/model/piece"
const DEFAULT_BOARD_PATTERN_PATH = "resources/client/texture/board/board-pattern.png"

const DEFAULT_PIECE_ROTATION_X = 1.6
const DEFAULT_PIECE_ROTATION_Y = 1.7
const DEFAULT_PIECE_ROTATION_Z = -.1

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

        this.ready = false

        this.mar(2).pad(2).ffm().html("ThreeBoard Loading Pieces ...")
    }

    createPiece(piece){
        let threePiece

        switch(piece.kind){
            case "p":
                threePiece = THREE_PIECE_CACHE["Pawn"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "n":
                threePiece = THREE_PIECE_CACHE["Knight"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "b":
                threePiece = THREE_PIECE_CACHE["Bishop"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "r":
                threePiece = THREE_PIECE_CACHE["Rook"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "q":
                threePiece = THREE_PIECE_CACHE["Queen"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "k":
                threePiece = THREE_PIECE_CACHE["King"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "e":
                threePiece = THREE_PIECE_CACHE["Rook"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
            case "h":
                threePiece = THREE_PIECE_CACHE["Bishop"].clone()
                threePiece.scale.set(this.PIECE_SCALE, this.PIECE_SCALE, this.PIECE_SCALE)
                break
        }        

        threePiece.material = new THREE.MeshLambertMaterial({color: piece.color ? 0xffffff : 0x00ff00})                                

        if(piece.color) threePiece.rotation.y += Math.PI

        this.pieceStore.push(threePiece)

        this.threeRenderer.scene.add(threePiece)

        return threePiece
    }

    squareCoords(sq){
        return Vect(
            (sq.file - (NUM_SQUARES / 2)) * this.BOARD_GRID_WIDTH,
            ((LAST_SQUARE - sq.rank) - (NUM_SQUARES / 2)) * this.BOARD_GRID_HEIGHT)
    }

    squareMiddleCoords(sq){
        return this.squareCoords(sq).p(Vect(this.BOARD_GRID_WIDTH / 2, this.BOARD_GRID_HEIGHT / 2))
    }

    placePieceAtSquare(piece, sq, dx, dy, dz){
        let sqmcs = this.squareMiddleCoords(sq)
        piece.position.set(sqmcs.x + (dx || 0), sqmcs.y + (dy || 0), dz || 0)
    }

    drawPieces(){
        for(let sq of ALL_SQUARES){
            let p = this.board.pieceatsquare(sq)
            if(!p.isempty()){                
                let piece = this.createPiece(p)                

                if((p.kind == "e") || (p.kind == "h")){
                    this.placePieceAtSquare(piece, sq,
                        -this.BOARD_GRID_WIDTH*0.2,
                        -this.BOARD_GRID_HEIGHT*0.15 * ( p.color ? 1 : -1 )
                    )

                    let plusKnight = this.createPiece(Piece("n", p.color))                    
                    this.placePieceAtSquare(plusKnight, sq,
                        this.BOARD_GRID_WIDTH*0.25,
                        this.BOARD_GRID_HEIGHT*0.15 * ( p.color ? 1 : -1 )
                    )
                }else{
                    this.placePieceAtSquare(piece, sq)
                }
            }
        }
    }

    clearPieces(){
        for(let object of this.pieceStore){
            this.threeRenderer.scene.remove(object)
        }
    }

    intDegToRad(deg){
        return parseInt(deg) / 180 * Math.PI
    }

    draw(){
        this.clearPieces()

        this.drawPieces()

        this.threeRenderer.scene.rotation.x = -0.5 * this.intDegToRad(this.settings.rotXCombo.selected)        
        this.threeRenderer.scene.rotation.z = ( this.flip ? Math.PI : 0 ) + this.intDegToRad(this.settings.rotZCombo.selected)        

        this.threeRenderer.render()

        this.ready = true
    }

    setFromFen(fen, variant){
        this.board.setfromfen(fen, variant)

        this.draw()
    }

    setFromGame(game){
        this.flip = game.flip

        this.setFromFen(game.fen(), game.variant)
    }

    init(){
        this.loadPieces()
    }

    get scale(){
        return this.props.scale || 1
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

        this.BOARD_GRID_WIDTH = this.THREE_WIDTH / 2000 * this.scale
        this.BOARD_GRID_HEIGHT = this.THREE_HEIGHT / 2000 * this.scale
        
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

                let geometry = new THREE.BoxGeometry(
                    this.THREE_WIDTH / 250 * this.scale,
                    this.THREE_HEIGHT / 250 * this.scale,
                    ( this.THREE_HEIGHT + this.THREE_WIDTH ) / 8000 * this.scale
                )

                let threeBoard = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(boardMaterials))

                this.threeRenderer.scene.add(threeBoard)

                this.x().por().ame(
                    this.canvasHook = div().poa(),
                    div().bc("#ccc").pad(1).mar(1).poa().a(
                        Labeled("&nbsp;Rot X (deg) ", Combo({                    
                            id: "rotXCombo",                    
                            display: "Rot X (deg)",                                        
                            options: Array(19).fill(null).map((_, i) => ({value: i*5, display: i*5})),
                            selected: 50,
                            settings: this.settings,
                            changeCallback: this.draw.bind(this)
                        })).bc("#eee"),
                        Labeled("&nbsp;Rot Z (deg) ", Combo({                    
                            id: "rotZCombo",                    
                            display: "Rot Z (deg)",                                        
                            options: Array(19).fill(null).map((_, i) => ({value: (i-9)*5, display: (i-9)*5})),
                            selected: 0,
                            settings: this.settings,
                            changeCallback: this.draw.bind(this)
                        })).bc("#eee").marl(3)
                    )
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
            this.objLoader = new THREE.OBJLoader()

            let numLoadedPieces = 0

            for(let threePieceKind of missingPieces)
            this.objLoader.load(THREE_PIECE_MODELS_PATH + "/" + threePieceKind + ".obj", object => {
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

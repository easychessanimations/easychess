const DEFAULT_CHAT_WIDTH = 300

class PlayerPanel_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.parentTable = this.props.parentTable

        this.player = this.props.player || Player()

        this.setPlayer(this.player)
    }

    setPlayer(player){
        this.player = player

        this.x().a(
            div().dfc().a(
                div().bc("#eee").pad(2).html(this.player.qualifiedDisplayName(SHOW_RATING))
            )
        )
    }
}
function PlayerPanel(props){return new PlayerPanel_(props)}

class Table_ extends SmartDomElement{
    constructor(props){
        super("div", props)
    }

    calcProps(){
        this.chatWidth = this.props.chatWidth || DEFAULT_CHAT_WIDTH
        this.chatHeight = this.board.boardsize() - 29
    }

    init(){
        this.board = Board({...this.props, ...{
            id: "board",
            parentApp: this
        }})

        this.calcProps()

        this.boardContainer = div().dfcc().a(
            this.board
        )

        this.chatContainer = div().dfcc().a(
            this.chatText = TextAreaInput().w(this.chatWidth).h(this.chatHeight),
            this.chatInput = TextInput().w(this.chatWidth).mart(2)
        )

        this.playerPanels = [
            PlayerPanel(),
            PlayerPanel()
        ]

        this.mainContainer = table().a(
            tr().a(
                td().a(this.playerPanels[0]),
                td()
            ),
            tr().a(
                td().a(this.boardContainer),
                td().a(this.chatContainer),
            ),
            tr().a(
                td().a(this.playerPanels[1]),
                td()
            ),
        )

        this.mainContainer.bimg("url(resources/client/img/backgrounds/wood.jpg)")

        this.mar(3)

        this.ame(this.mainContainer)
    }
}
function Table(props){return new Table_(props)}

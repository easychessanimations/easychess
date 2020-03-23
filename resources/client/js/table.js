const DEFAULT_CHAT_WIDTH = 300

class PlayerPanel_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.parentTable = this.props.parentTable

        this.player = this.props.player || Player()

        this.setPlayer(this.player)
    }

    sit(){
        api("play:sitPlayer", {            
            index: this.player.index
        }, response => {
            //console.log(response)
        })
    }

    unseat(){
        api("play:unseatPlayer", {            
            index: this.player.index
        }, response => {
            //console.log(response)
        })
    }

    build(){
        this.x().h(25)

        if(this.player.seated){
            this.a(
                div().dfc().a(
                    UserLabel(this.player),
                    Button("Unseat", this.unseat.bind(this))
                )                
            )
        }else{
            this.a(
                Button("Sit", this.sit.bind(this))
            )
        }
    }

    setPlayer(player){
        this.player = player

        this.build()
    }
}
function PlayerPanel(props){return new PlayerPanel_(props)}

class Table_ extends SmartDomElement{
    constructor(props){
        super("div", props)
    }

    get g(){return this.board.game}
    get players(){return this.g.players}

    calcProps(){
        this.chatWidth = this.props.chatWidth || DEFAULT_CHAT_WIDTH
        this.chatHeight = this.board.boardsize() - 29
    }

    chatMessageEntered(msg){
        api("play:postChatMessage", {
            chatMessage: ChatMessage({
                author: USER_BLOB(),
                msg: msg
            })
        }, response => {
            //console.log(response)
        })
    }

    cancelEditTimecotrol(){
        this.timecontrolFormHook.x()
    }

    editTimeControl(){
        this.timecontrolFormHook.x().a(
            div().mar(5).tac().pad(5).bc("#aff").a(
                div().html("TODO : EDIT TIME CONTROL"),
                Button("Cancel", this.cancelEditTimecotrol.bind(this)).mart(5)
            )
        )
    }

    build(){
        this.chatText.setValue(this.g.chat.asText())        
        this.players.forEach(player => this.playerPanels[player.index].setPlayer(player))
        this.timecontrolDiv.x().a(
            TimecontrolLabel({timecontrol: this.g.timecontrol}),
            Button("Edit", this.editTimeControl.bind(this)).marl(5)
        )
    }

    buildFromGame(game){
        this.board.setgame(game)        
        this.build()
    }

    processApi(topic, payload){
        switch(topic){
            case "updategame":                
                let game = Game(payload.game)
                this.buildFromGame(game)
                break
        }
    }

    init(){        
        this.parentApp = this.props.parentApp

        this.board = Board({...this.props, ...{
            id: "board",
            parentApp: this
        }})

        this.calcProps()

        this.boardContainer = div().dfcc().a(
            this.board
        )

        this.chatContainer = div().por().a(
            this.timecontrolFormHook = div().poa().zi(100),
            div().dfcc().a(            
                this.chatText = TextAreaInput().w(this.chatWidth).h(this.chatHeight),
                this.chatInput = TextInput({
                    enterCallback: this.chatMessageEntered.bind(this)
                })
                    .w(this.chatWidth).mart(2),            
            )            
        )

        this.playerPanels = [0,1].map(i => PlayerPanel({player: Player().setIndex(i)}))

        this.mainContainer = table().a(
            tr().a(
                td().a(this.playerPanels[0]),
                td().a(this.timecontrolDiv = div())
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

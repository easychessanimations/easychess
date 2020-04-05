const DEFAULT_CHAT_WIDTH = 300

class PlayerPanel_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.parentTable = this.props.parentTable

        this.player = this.props.player || Player()

        this.setPlayer(this.player)

        this.dfc()
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

    resign(){
        api("play:resignPlayer", {            
            index: this.player.index
        }, response => {
            //console.log(response)
        })
    }

    get g(){return this.parentTable.g}

    offerDraw(){
        api("play:offerDraw", {            
        }, response => {
            //console.log(response)
        })
    }

    revokeDraw(){
        api("play:revokeDraw", {            
        }, response => {
            //console.log(response)
        })
    }

    build(){
        this.x().h(28)

        let isTurn = this.player.equalTo(this.g.turnPlayer())

        if(this.g.inProgress){
            this.a(
                div().dfc().a(
                    ThinkingTimeLabel({...this.player,...{isTurn: isTurn}}).marr(8),
                    UserLabel(this.player),                    
                    IS_ME(this.player) ?
                        this.player.offerDraw ?
                            Button("Revoke Draw", this.revokeDraw.bind(this)).marl(3).bc(YELLOW_BUTTON_COLOR)
                        :
                            this.g.drawOffered() ?                            
                                Button("Accept Draw", this.offerDraw.bind(this)).marl(3).bc(GREEN_BUTTON_COLOR).ac("blink_me")
                            :
                                Button("Offer Draw", this.offerDraw.bind(this)).marl(3).bc(GREEN_BUTTON_COLOR)
                    :
                        div(),
                    IS_ME(this.player) ? Button("Resign", this.resign.bind(this)).bc(RED_BUTTON_COLOR) : div(),                    
                )                
            )
        }else if(this.player.seated){
            this.a(
                div().dfc().a(
                    UserLabel(this.player),
                    Button("Unseat", this.unseat.bind(this)).marl(3).bc(RED_BUTTON_COLOR)
                    .toolTip({msg: "Unseat player"}),
                )                
            )
        }else{
            this.a(
                Button("Sit", this.sit.bind(this)).w(this.parentTable.board.boardsize() / 2).marl(3).bc(GREEN_BUTTON_COLOR)
                    .toolTip({msg: "Sit at table to play"}),
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

        this.settings = {}
    }

    showOnline(online){
        this.onlineUsersDiv.x().a(
            Object.entries(online).map(entry => UserLabel(entry[1]).fs(11))
        )
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

    cancelEditTimecontrol(){        
        this.timecontrolFormHook.x()
        this.editTimeControlOn = false
    }

    editTimeControl(){
        this.timecontrolFormHook.x()
        this.editTimeControlOn = !this.editTimeControlOn
        if(this.editTimeControlOn) this.timecontrolFormHook.am(
            div().dfcc().bdr("solid", 5, "#aaa").mar(5).tac().pad(5).bc("#aff").a(
                FormTable({
                    options: [
                        Combo({                    
                            id: "variantCombo",                    
                            display: "Variant",                                        
                            options: SUPPORTED_VARIANTS.map(entry => ({value: entry[0], display: entry[1]})),
                            selected: this.g.variant,
                            settings: this.settings
                        }),
                        Combo({                    
                            id: "initialClockCombo",                    
                            display: "Initial Clock",                                        
                            options: Array(61).fill(0).map((_, i) => ({value: i, display: i})),
                            selected: 15,
                            settings: this.settings
                        }),
                        Combo({                    
                            id: "incrementCombo",                    
                            display: "Increment",                                        
                            options: Array(61).fill(0).map((_, i) => ({value: i, display: i})),
                            selected: 20,
                            settings: this.settings
                        })
                    ]
                })
                    .marl(10),
                div().a(
                    Button("Set", this.setTimecontrol.bind(this)).bc(GREEN_BUTTON_COLOR).mart(5)
                        .toolTip({msg: "Set variant and time control"}),
                    Button("Set and Store", this.setAndStoreTimecontrol.bind(this)).bc(GREEN_BUTTON_COLOR).mart(5)
                        .toolTip({msg: "Set and store variant and time control in presets"}),                    
                    Button("Cancel / Close", this.cancelEditTimecontrol.bind(this)).bc(YELLOW_BUTTON_COLOR).mart(5)
                        .toolTip({msg: "Cancel / close this form"}),
                ),
                div().a(
                    div().mart(5).ffm().fs(12).html("Presets:")
                        .toolTip({msg: "Time control presets"}),
                    this.presets = EditableList({
                        id: "presets",
                        disableEditOption: true,
                        customAddButton:{
                            caption: "Set",
                            callback: this.setTimecontrolFromPreset.bind(this),
                            backgroundColor: GREEN_BUTTON_COLOR
                        },
                        optionLabelWidthScale: -0.21
                    }).mart(5)
                )
            )
        )
    }

    requestSetTimecontrol(blob){
        api("play:setTimecontrol", {            
            variant: blob.variant,
            timecontrol: blob.timecontrol
        }, response => {
            //console.log(response)
        })
    }

    setTimecontrolFromPreset(){
        let preset = this.presets.state.selected.value
        let parts = preset.split("|")
        this.requestSetTimecontrol({
            variant: parts[0],
            timecontrol: {
                initial: parseInt(parts[1]),
                increment: parseInt(parts[2])
            }
        })
    }

    calcTimecontrolBlob(){
        return {
            variant: this.settings.variantCombo.selected,
            timecontrol:{
                initial: parseInt(this.settings.initialClockCombo.selected),
                increment: parseInt(this.settings.incrementCombo.selected)
            }            
        }
    }

    setTimecontrol(){
        this.requestSetTimecontrol(this.calcTimecontrolBlob())
    }

    setAndStoreTimecontrol(){
        let blob = this.calcTimecontrolBlob()

        this.presets.addOption(
            `${blob.variant}|${blob.timecontrol.initial}|${blob.timecontrol.increment}`,
            `${displayNameForVariant(blob.variant)} ${blob.timecontrol.initial} + ${blob.timecontrol.increment}`
        )

        this.requestSetTimecontrol(blob)
    }

    build(){
        this.chatText.setValue(this.g.chat.asText())                                        
        this.players.forEach(player => this.playerPanels[this.g.flip ? 1 - player.index : player.index].setPlayer(player))
        this.timecontrolDiv.x().a(
            VariantLabel(this.g),
            TimecontrolLabel(this.g).marl(5),
            Button("Set", this.editTimeControl.bind(this)).marl(5)
                .toolTip({msg: "Set variant and time control"}),
        )
    }

    buildFromGame(game){
        //console.log(game)
        this.board.op(1)
        game.flip = IS_ME(game.players.getByColor(BLACK))        
        this.board.setgame(game)        
        this.build()
    }

    processApi(topic, payload){
        switch(topic){
            case "updategame":                
                let game = Game(payload.game)
                this.buildFromGame(game)
                break
            case "games":
                this.showGames(payload.games)
                break
        }
    }

    moveMade(san){        
        this.board.op(0.8)
        api("play:makeMove", {            
            san: san
        }, response => {
            //console.log(response)
        })
    }

    showGames(games){
        this.gamesContainer.x().a(games.map(blob => GameLabel({...blob, ...{
            analyzeCallback: this.parentApp.analyzeGame.bind(this.parentApp)
        }}).mart(3)))
    }

    init(){        
        this.parentApp = this.props.parentApp

        this.board = Board({...this.props, ...{
            id: "board",
            parentApp: this,
            makeMoveCallback: this.moveMade.bind(this)
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

        this.playerPanels = [0,1].map(i => PlayerPanel({
            parentTable: this,
            player: Player().setIndex(i)
        }))

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
            tr().a(                
                td().sa("colspan", 2).a(this.onlineUsersDiv = div().pad(2).bc("#eee"))
            ),
        )

        this.mainContainer.bimg("url(resources/client/img/backgrounds/wood.jpg)")

        this.mar(3)

        this.gamesContainer = div().hh(500).pad(5).mar(5).ovfys()

        this.uberContainer = table().a(
            tr().a(
                td().a(this.mainContainer),
                td().a(this.gamesContainer)
            )
        )

        this.ame(this.uberContainer)
    }
}
function Table(props){return new Table_(props)}

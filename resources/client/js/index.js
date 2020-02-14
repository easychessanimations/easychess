////////////////////////////////////////////////////////////////////////////////
// config

const STOCKFISH_JS_PATH         = "resources/client/cdn/stockfish.wasm.js"
const BACKUP_FETCH_URL          = "https://raw.githubusercontent.com/easychessanimations/easychess/master/backup/backup.txt"
const IMAGE_STORE_PATH          = "/resources/client/img/imagestore"

const DEFAULT_USERNAME          = "lishadowapps"

const DEFAULT_MAX_GAMES         = IS_DEV() ? 10 : 100

const POSITION_CHANGED_DELAY    = 500
const ALERT_DELAY               = 3000
const REBUILD_IMAGES_DELAY      = 3000
const STORE_DEFAULT_DELAY       = 1000
const HIGHLIGHT_DRAWINGS_DELAY  = 250
const PLAY_ANIMATION_DELAY      = 1000
const LOAD_LICHESS_USERS_DELAY  = 5000

const QUERY_INTERVAL            = PROPS.QUERY_INTERVAL || 3000

const GAME_TEXT_AREA_HEIGHT     = 130
const GAME_TEXT_AREA_WIDTH      = 882
const COMMENT_TEXT_AREA_WIDTH   = 310

const THUMB_SIZE                = 150

const GREEN_BUTTON_COLOR        = "#afa"
const BLUE_BUTTON_COLOR         = "#aaf"
const CYAN_BUTTON_COLOR         = "#aff"
const RED_BUTTON_COLOR          = "#faa"
const YELLOW_BUTTON_COLOR       = "#ffa"
const IDLE_BUTTON_COLOR         = "#eee"

const TREE_SEED                 = 10

const TREE_BACKWARD_DEPTH       = 10
const TREE_MAX_DEPTH            = 10

const DEFAULT_FRAME_DELAY       = 1000

const PASSWORD_KEY              = "PASSWORD"

const DEFAULT_MULTIPV           = 5
const DEFAULT_THREADS           = 2

const REMOVE_IMAGE_EXTENSION_REGEXP = /\.JPG$|\.PNG$|\.GIF$/i

const BACKUP_STORAGES = [
    "engine",
    "study"
]

const LOAD_GAMES_CHUNK              = () => IS_DEV() ? 100 : 100
const LOAD_GAMES_DELAY              = () => IS_DEV() ? 10000 : 10000
const LOAD_GAMES_INITIAL_DELAY      = 10000
const ARCHIVE_RENDER_CHUNK          = () => IS_DEV() ? 500 : 500
const LICHESS_USERS_RENDER_CHUNK    = () => IS_DEV() ? 50 : 50

const SHOW_FILTER_BOOK_TIMEOUT      = 500

const TREE_WIDTH                    = 20000

const FORCE_QUERY                   = true
const SHOW_COMMENT                  = true
const MERGE_ALL_MOVES               = true

const SHOULD_GO_DELAY               = 5000
const BOT_STARTUP_DELAY             = 7500

const DELETE_MOVE_WARN_LIMIT        = 50

const DEFAULT_REDUCE_THINKING_TIME  = 1

////////////////////////////////////////////////////////////////////////////////

class LocalEngine extends AbstractEngine{
    constructor(sendanalysisinfo){
        super(sendanalysisinfo)
    }

    spawnengineprocess(){
        this.stockfish = new Worker(STOCKFISH_JS_PATH)

        this.stockfish.onmessage = message => {
            this.processstdoutline(message.data)
        }
    }

    sendcommandtoengine(command){
        this.stockfish.postMessage(command)
    }

    terminate(){
        this.stockfish.terminate()
    }
}

////////////////////////////////////////////////////////////////////////////////

class App extends SmartDomElement{
    get g(){return this.board.game}
    get b(){return this.g.board}
    get variant(){return this.g.variant}
    get fen(){return this.g.fen()}
    get perf(){return this.settings.perfCombo ? this.settings.perfCombo.selected : DEFAULT_PERF}
    get trainMode(){return this.settings.trainModeMultipleSelect.selected[0].value}

    fetchLichessUsers(){        
        getLichessLeaderBoard(this.perf).then(lb => {                                    
            (async function(){
                let i = 0
                for(let user of lb){
                    let oldUser = await IDB.get("user", user.id)
                    user.lastPut = new Date().getTime()
                    if(!oldUser.hasContent) await IDB.put("user", user)
                    i++
                }      
                this.alert(`Fetched ${i} user(s).`, "success")          
                this.loadLichessUsers()
            }.bind(this))()            
        })        
    }

    putLichessUsers(list){
        (async function(){
            let i = 0
            for(let user of list){                
                user.profileQueried = true
                user.lastPut = new Date().getTime()
                await IDB.put("user", user)                        
                i++
            }
            this.alert(`${i} users stored. Like ${list.slice(0, Math.min(10, list.length)).map(user => user.id).join(" , ")} .`, "success")
            this.loadLichessUsers()
        }.bind(this))()                
    }

    queryLichessUsers(force){        
        if(force) this.lichessusers.sort((a,b) => a.lastPut - b.lastPut)

        fetchLichessUsers(
            this.lichessusers.filter(user => force || (!user.profileQueried))
            .map(user => user.id)
        ).then(result => this.putLichessUsers(result))
    }

    getLichessUserById(id){
        return this.lichessusers.find(user => user.id == id)
    }

    getLichessUserFollow(user, kind){        
        getLichessUserFollow(user.id, kind).then(result => {
            user[kind + "Queried"] = true                
            user.lastPut = new Date().getTime()
            IDB.put("user", user).then(_ =>
                this.putLichessUsers(result.filter(user => !this.getLichessUserById(user.id))))                
        })
    }

    renderLichessUser(user, index){                
        return div().bc("#aff").mar(2).dfc().a(
            div().marl(5).ww(50).html("" + (index + 1)),
            div().dfc().fwb().c("#00f").marl(5).ww(170).a(
                user.title ? div().fs(11).c("#660").mar(5).html(user.title) : div(),
                div().html(user.id)
            ),            
            ["followers", "following"].map(kind =>
                user[kind + "Queried"] ? div().ww(80) :
                    Button("Get " + kind, this.getLichessUserFollow.bind(this, user, kind)).ww(80)
            ),            
            div().bc("#ccd").mar(2).a(Object.entries(user.perfs).filter(perf => perf[1].games).sort((a,b) => b[1].rating - a[1].rating).map(perf =>
                div().mar(2).pad(2).dib().bc(perf[0] == this.perf ? "#0f0" : "#eee").html(perf[0] + " " + perf[1].rating + " # " + perf[1].games)
            ))
        )
    }

    deleteAllLichessUsers(){
        (async function(){
            let i = 0
            for(let user of this.lichessusers){
                await IDB.delete("user", user.id)
                i++
            } 
            this.alert(`Deleted ${i} user(s).`, "success")           
            this.lichessUserPages.lastScrollTop = 0
            this.lichessUserPages.lastRenderedPage = 0
            this.loadLichessUsers()
        }.bind(this))()
    }

    getLichessUsersWithProfile(){
        return this.lichessusers.filter(user => user.profile)
    }

    getLichessUsersWithTitle(){
        return this.getLichessUsersWithProfile().filter(user => user.title)
    }

    lichessUserCompare(a, b){        
        try{
            let diff = ( b.perfs[this.perf] ? b.perfs[this.perf].rating : 600 ) - ( a.perfs[this.perf] ? a.perfs[this.perf].rating : 600 )
            return diff
        }catch(err){}
    }

    renderLichessUsers(){                
        this.lichessUserPages = this.lichessUserPages || RenderPages({
            list: this.lichessusers,
            chunkSize: LICHESS_USERS_RENDER_CHUNK(),
            renderItem: this.renderLichessUser.bind(this),
            sortItems: this.lichessUserCompare.bind(this),
            headWidth: 860,
            bodyWidth: 860,
            bodyHeight: 480,
        })
        this.lichessUserPages.list = this.lichessusers        
        this.lichessUsersDiv.x().ame(
            this.usersControlPanel = div().mar(5).bc("#eee").pad(2).dfca().a(
                div().dfc().a(
                    div().fs(11).html(`Total Users`),
                    div().marl(5).fwb().html(`${this.lichessusers.length}`).c("#00f"),
                    div().fs(11).marl(10).html(`Titled`),
                    div().marl(5).fwb().html(`${this.getLichessUsersWithTitle().length}`).c("#770"),
                ),
                Button("Fetch", this.fetchLichessUsers.bind(this)).bc(GREEN_BUTTON_COLOR),
                Combo({                    
                    id: "perfCombo",                    
                    display: "Perf",                                        
                    options: SUPPORTED_PERFS.map(entry => ({value: entry[0], display: entry[1]})),
                    selected: DEFAULT_PERF,
                    settings: this.settings,
                    changeCallback: this.loadLichessUsers.bind(this)
                }),
                Button("Query", this.queryLichessUsers.bind(this, !FORCE_QUERY)).bc(BLUE_BUTTON_COLOR),
                Button("Force Query", this.queryLichessUsers.bind(this, FORCE_QUERY)).bc(YELLOW_BUTTON_COLOR),
                Button("Delete All", this.deleteAllLichessUsers.bind(this)).bc(RED_BUTTON_COLOR),
            ),
            this.lichessUserPages
        )
        this.lichessUserPages.refresh(this.lichessUserPages.lastRenderedPage)
    }

    constructor(props){
        super("div", props)

        this.shouldGo = localStorage.getItem("shouldGo")

        if(this.shouldGo) this.doLater("go", SHOULD_GO_DELAY)
        else this.doLater("stop", SHOULD_GO_DELAY)

        this.lastClickedGameId = localStorage.getItem("lastClickedGameId")

        this.bookWorker = new Worker('book.worker.js?ver=2')

        this.bookWorker.onmessage = this.onBookWorkerMessage.bind(this)

        this.settings = {}

        this.engine = new LocalEngine(this.processanalysisinfo.bind(this))

        this.board = this.createBoard()

        this.mainPane = SplitPane({            
            fitViewPort: true,
            headsize: 20,
            headSelectable: true,
        }).por(),            

        this.movesDiv = div()

        this.movesDiv.resize = this.positionchanged.bind(this)

        this.transpositionsDiv = div()

        this.analysisinfoDiv = this.renderAnalysisInfoDiv()

        this.treeDiv = div()

        this.treeDiv.resize = this.onTreeDivResize.bind(this)

        this.trainDiv = this.renderTrainDiv()

        this.botDiv = this.renderBotDiv()

        this.imageDiv = this.renderImageDiv()

        this.authDiv = this.renderAuthDiv()

        this.lichessUsersDiv = div()

        this.animsDiv = div()

        this.backupDiv = this.renderBackupDiv()

        this.settingsDiv = this.renderSettingsForm()

        this.botSettingsDiv = this.renderBotSettingsForm()

        this.aboutDiv = this.renderAboutDiv()

        this.logDiv = this.renderLogDiv()

        this.multiPGNDiv = this.renderMultiPGNDiv()

        this.fenDiv = this.renderFenDiv()

        this.studyDiv = this.renderStudyDiv()

        this.tourneyDiv = this.renderTourneyDiv()

        this.gamesDiv = this.renderGamesDiv()

        this.gamesDiv.resize = this.buildGames.bind(this)

        this.archiveDiv = this.renderArchiveDiv()

        this.filterDiv = this.renderFilterDiv()

        this.filterBookDiv = this.renderFilterBookDiv()

        this.chartDiv = div()

        this.createTabPanes()

        this.alertDiv = this.renderAlertDiv()

        this.mainPane.a(this.alertDiv)
+ 
        this.setupsource()        

        this.checkSourceInterval = setInterval(this.checksource.bind(this), QUERY_INTERVAL)

        this.lastApiTick = performance.now()

        this.apiPingInterval = setInterval(this.apiPing.bind(this), 5 * QUERY_INTERVAL)
        this.checkApiInterval = setInterval(this.checkApi.bind(this), 5 * QUERY_INTERVAL)

        this.loadStudy("Default")

        this.trainChanged()

        this.showImages()

        this.loadImagestore()

        this.fetchGames()

        this.loadGames()

        this.doLater("loadLichessUsers", LOAD_LICHESS_USERS_DELAY)

        if(window.location.search.match(/login-bot=ok/)) this.tabs.selectTab("bot")

        if(this.USER().isBot){
            this.botInfoDiv.html("Upgrading lichess-bot .")

            this.doLater("botStartUp", BOT_STARTUP_DELAY)
        }

        this.buildStudies()

        this.setInfoBar("Welcome to easychess.")
    }

    reportMultiPGN(docomments){
        this.multiPGNTextAreaInput.setValue(this.g.pgn(docomments, this.getcurrentnode(), DO_MULTI, this.settings.keepBaseLineCheckboxInput.checked)).copy()
    }

    reportMultiPGNWithAnalysis(){
        IDB.getKeys("engine", this.getcurrentnode().subnodes().map(node => node.analysiskey)).then(analysis => {            
            this.multiPGNTextAreaInput.setValue(this.g.pgn(analysis, this.getcurrentnode(), DO_MULTI, this.settings.keepBaseLineCheckboxInput.checked)).copy()
        })
    }

    pgnHeadersChanged(){
        this.g.setHeaders(this.pgnHeadersEditableList.subState().map(entry => [entry[0], entry[1].text]))
        this.doLater("storeDefault", 2 * STORE_DEFAULT_DELAY)
    }

    renderMultiPGNDiv(){
        return div().a(
            div().mar(5).a(
                div().addStyle("width", "100%").pad(2).bc("#eee").a(
                    Button("Report", this.reportMultiPGN.bind(this, !DO_COMMENTS)).bc(GREEN_BUTTON_COLOR),
                    Button("Report with comments", this.reportMultiPGN.bind(this, DO_COMMENTS)).bc(GREEN_BUTTON_COLOR),
                    Button("Report with analysis", this.reportMultiPGNWithAnalysis.bind(this)).bc(YELLOW_BUTTON_COLOR),
                    Labeled("Keep base",
                        this.keepBaseLineCheckboxInput = CheckBoxInput({
                            id: "keepBaseLineCheckboxInput",
                            settings: this.settings
                        })
                    )
                ),
                div().a(
                    this.pgnHeadersEditableList = EditableList({
                        id: "pgnHeadersMultipleSelect",
                        isContainer: true,
                        label: "PGN Headers",
                        forceCreateKind: "text",
                        useValueAsDisplay: true,
                        changeCallback: this.pgnHeadersChanged.bind(this),
                        optionChangedCallback: this.pgnHeadersChanged.bind(this)
                    })
                        .mart(2)
                ),
                this.multiPGNTextAreaInput = TextAreaInput()
                    .mar(3)
                    .addStyle("width", "calc(100% - 10px)").h(480)
                    .ae("paste", this.multiPGNPasted.bind(this))
            )
        )
    }

    reportFen(){
        this.fenTextInput.setValue(this.fen).copy()
    }

    fenPasted(ev){
        ev.preventDefault()

        let content = ev.clipboardData.getData('Text')        

        let transpositions = this.g.transpositions({fen: content})

        if(transpositions.length){
            this.alert("Fen found.", "success")
            this.board.setfromnode(transpositions[0])
            if(transpositions.length > 1){
                this.tabs.selectTab("transpositions")
            }else{
                this.tabs.selectTab("moves")
            }            
        }else{
            this.alert("Fen not found.", "error")
        }
    }

    saveStudiesState(){
        storeLocal("studies", this.studies)
        storeLocal("selectedStudy", this.selectedStudy)
    }

    setStudy(study){
        let index = this.studies.findIndex(st => st.title == study.title)        
        if(index < 0){
            this.studies.push(study)
            return
        }
        this.studies[index] = study
    }

    createStudy(){
        let title = window.prompt("Study title : ", "Study " + this.g.line())
        if(!title) return
        let study = this.findStudyByTitle(title) || this.defaultStudyBlob()
        study.title = title
        this.setStudy(study)
        this.selectedStudy = study
        this.saveAndBuildStudies()
        this.setInfoBar()
    }

    saveAndBuildStudies(){
        this.saveStudiesState()
        this.buildStudies()
    }

    deleteStudy(study){
        if(study.title == "Default"){
            this.alert("Default study cannot be deleted .", "error")
            return
        }
        if(!confirm(`Delete ${study.title} and all its moves?`, "delete")) return
        IDB.delete("study", study.title).then(result => {
            if(result.ok){                
                this.studies = this.studies.filter(st => st.title != study.title)
                this.selectedStudy = this.findStudyByTitle("Default")
                this.saveAndBuildStudies()
                this.alert(`Study " ${study.title} " deleted .`, "success")
                this.setInfoBar()
            }
        })
    }

    loadStudyFrom(study){
        this.loadStudy(study.title).then(msg => {
            this.alert(msg)
            if(msg[1] == "success"){
                this.selectedStudy = study
                this.saveAndBuildStudies()
                this.tabs.selectTab("moves")
                this.setInfoBar()
            }
        })
    }

    saveStudyTo(study){
        this.storeStudy(study.title, this.g).then(result => {
            if(result.ok) this.alert(`Saved study " ${study.title} " .`, "success")
            this.selectedStudy = study
            this.saveAndBuildStudies()
            this.setInfoBar()
        })
    }

    createNodeForStudy(study){
        return div()
            .bc(study.title == this.selectedStudy.title ? "#0f0" : "#eee")
            .pad(2).mar(2).a(
            div()            
            .dfc().jc("space-between").a(
                div().fwb().pad(3).bc("#eee").html(study.title).addStyle("width", "100%"),
                Button("Save", this.saveStudyTo.bind(this, study)).fs(18).bc(GREEN_BUTTON_COLOR).marl(5),
                Button("Load", this.loadStudyFrom.bind(this, study)).fs(18).bc(BLUE_BUTTON_COLOR).marl(5),
                Button("X", this.deleteStudy.bind(this, study)).marl(5).bc(RED_BUTTON_COLOR)
            )            
        )
    }

    findStudyByTitle(title){
        return this.studies.find(study => study.title == title)
    }

    defaultStudyBlob(){
        return {
            title: "Default"
        }
    }

    buildStudies(){
        this.studies = getLocal("studies", [
            this.defaultStudyBlob()
        ])

        this.selectedStudy = getLocal("selectedStudy", this.defaultStudyBlob())

        this.studiesDiv.x().a(this.studies.map(study => this.createNodeForStudy(study)))
    }

    renderStudyDiv(){
        return div().a(            
            div().bc("#eee").mar(5).pad(5).a(
                div().a(
                    Button("Create new study", this.createStudy.bind(this))
                )
            ),
            div().marl(5).marr(5).a(
                this.studiesDiv = div()
            )
        )
    }

    renderFenDiv(){
        return div().a(
            div().mar(5).a(
                div().addStyle("width", "100%").pad(2).bc("#eee").a(
                    Button("Report", this.reportFen.bind(this)).bc(GREEN_BUTTON_COLOR),                    
                ),
                this.fenTextInput = TextInput()
                    .mar(3)
                    .addStyle("width", "calc(100% - 10px)")
                    .ae("paste", this.fenPasted.bind(this))
            ),
            div().mar(5).pad(5).bc("#faa").a(
                div().html("Reset from this FEN ( paste ) :").c("#700"),
                this.fenResetTextInput = TextInput()
                    .mar(3)
                    .addStyle("width", "calc(100% - 10px)")
                    .ae("paste", this.fenResetPasted.bind(this))
            ),
            div().mar(5).pad(5).bc("#faa").a(
                div().html("Reset from this PGN ( paste ) :").c("#700"),
                this.fenResetTextAreaInput = TextAreaInput()
                    .mar(3)
                    .addStyle("width", "calc(100% - 10px)")
                    .h(100)
                    .ae("paste", this.multiPGNResetPasted.bind(this))
            ),
            Button("Reduce Line", this.reduceLine.bind(this)).mar(5).bc(RED_BUTTON_COLOR),
            Button("Reduce", this.reduce.bind(this)).mar(5).bc(RED_BUTTON_COLOR)
        )
    }

    reduceLine(){
        if(!confirm(`Reduce study to line ${this.g.line()} ?`, "reduce")) return

        this.g.reduceLine()

        this.board.setgame(this.g)

        this.tabs.selectTab("moves")
    }

    reduce(){
        if(!confirm(`Reduce study to position ${this.fen} ?`, "reduce")) return        

        this.board.setgame(this.g.reduce())

        this.tabs.selectTab("moves")
    }

    fenResetPasted(ev){
        ev.preventDefault()        

        let content = ev.clipboardData.getData('Text')        

        if(!confirm(`Are you sure you want to reset study from FEN ${content}. All moves will be lost.`, "reset")) return

        this.g.setfromfen(content)

        this.board.setgame(this.g)
    }

    multiPGNResetPasted(ev){
        ev.preventDefault()

        let content = ev.clipboardData.getData('Text')        

        if(!confirm(`Are you sure you want to reset study from PGN ${content}. All moves will be lost.`, "reset")) return

        let newGame = Game()
        
        newGame.parsePGN(content, this.variant)[1]

        this.board.setgame(newGame)

        this.board.setgame(this.g)

        this.tabs.selectTab("moves")
    }

    multiPGNPasted(ev){
        ev.preventDefault()

        let content = ev.clipboardData.getData('Text')        

        let newGame = Game().parsePGN(content, this.variant)[1]

        this.alert(this.g.mergeGame(newGame), "info")

        this.board.setgame(this.g)

        this.tabs.selectTab("moves")
    }

    getLiapiState(){
        api("liapi:getstate", {
            password: this.askPass(),
        }, response => {
            if(response.ok){
                this.liapiStateTextAreaInput.setValue(JSON.stringify(response.state, null, 2))
                this.liapiStateTextAreaInput.textChanged()
            }
        })
    }

    writeLiapiState(){
        try{
            this.liapiStateTextAreaInput.textChanged()

            let liapiState = JSON.parse(this.liapiStateTextAreaInput.value())

            api("liapi:writestate", {
                password: this.askPass(),
                liapiState: liapiState,
            }, response => {
    
            })
        }catch(err){
            this.alert("Could not parse JSON.", "error")
        }
    }

    liapiLogin(){
        let liapiUsername = this.liapiUsernameTextInput.value()
        let liapiPassword = this.liapiPasswordTextInput.value()

        api("liapi:login", {
            password: this.askPass(),
            liapiUsername: liapiUsername,
            liapiPassword: liapiPassword
        }, response => {

        })
    }

    liapiJoinTourney(){
        let liapiTourneyId = this.liapiTourneyIdTextInput.value()
        let liapiUsername = this.liapiUsernameTextInput.value()
        
        api("liapi:jointourney", {
            password: this.askPass(),            
            liapiTourneyId: liapiTourneyId,
            liapiUsername: liapiUsername,
        }, response => {

        })
    }

    liapiCreateTourney(){        
        let liapiUsername = this.liapiUsernameTextInput.value()
        let liapiTemplateName = this.liapiTemplateNameTextInput.value()
        
        api("liapi:createtourney", {
            password: this.askPass(),                        
            liapiUsername: liapiUsername,
            liapiTemplate: {template: liapiTemplateName}
        }, response => {

        })

        window.open(LICHESS_TOURNAMENT_PAGE)
    }

    liapiStartDateChanged(date){
        try{
            let liapiState = JSON.parse(this.liapiStateTextAreaInput.value())
            let liapiTemplateName = this.liapiTemplateNameTextInput.value()

            liapiState.templates[liapiTemplateName].startDate = new Date(date).getTime()

            this.liapiStateTextAreaInput.setValue(JSON.stringify(liapiState, null, 2))
        }catch(err){
            this.alert("Could not parse JSON.", "error")
        }
    }

    renderTourneyDiv(){
        return div().a(
            div().mar(5).a(
                div().pad(2).bc("#eee").a(                    
                    Button("Write State", this.writeLiapiState.bind(this)).bc(GREEN_BUTTON_COLOR).w(250),
                    Button("Get State", this.getLiapiState.bind(this)).bc(RED_BUTTON_COLOR),
                    Labeled("Username", this.liapiUsernameTextInput = TextInput({id: "liapiUserNameTextInput"})),
                    Labeled("Password", this.liapiPasswordTextInput = TextInput()),
                    Button("Login", this.liapiLogin.bind(this)).bc(GREEN_BUTTON_COLOR),
                    Labeled("Tourney Id", this.liapiTourneyIdTextInput = TextInput({id: "liapiTourneyIdTextInput"})),
                    Button("Join Tourney", this.liapiJoinTourney.bind(this)),
                    Labeled("Template Name", this.liapiTemplateNameTextInput = TextInput({id: "liapiTemplateNameTextInput"})),
                    Labeled("Start Date", this.liapiStartDateDateTimeInput = DateTimeInput({
                        id: "liapiliapiStartDateDateTimeInput",
                        changeCallback: this.liapiStartDateChanged.bind(this)
                    })),                    
                    Button("Create Tourney", this.liapiCreateTourney.bind(this)).bc(GREEN_BUTTON_COLOR).w(250),
                )
            ),
            div().mar(5).a(
                this.liapiStateTextAreaInput = TextAreaInput({id: "liapiStateTextArea"}).w(870).h(450)
            )
        )
    }

    logBotEvent(event){
        this.botEventLogger.log(LogItem({text: "bot event", json: event}))
    }

    playGame(id){
        // abort game if not started
        setTimeout(() => abortLichessGame(id, this.USER().accessToken), 30000)

        let gameFull

        let engine = new LocalEngine(() => {})

        let ratingDiff = 0

        let poweredBy = () => {
            this.writeBotChat(id, ["player", "spectator"], `${gameFull.botName} powered by https://easychess.herokuapp.com .`)
        }

        let processGameEvent = (event) => {
            setTimeout(() => {
                this.botEventLogger.log(LogItem({text: "game event", json: event, cls: "brown"}))
            }, 100)

            let state

            if(event.type == "gameFull"){
                this.setInfoBar(`Playing game ${event.white.name} - ${event.black.name} .`)

                gameFull = event

                gameFull.botTurn = WHITE

                let botRating = gameFull.white.rating || 1500
                let oppRating = gameFull.black.rating || 1500

                gameFull.botName = gameFull.white.name
                gameFull.opponentName = gameFull.black.name

                if(gameFull.black.id == this.USER().id){
                    gameFull.botTurn = BLACK

                    botRating = gameFull.black.rating || 1500
                    oppRating = gameFull.white.rating || 1500

                    gameFull.botName = gameFull.black.name
                    gameFull.opponentName = gameFull.white.name
                }

                ratingDiff = oppRating - botRating

                let testBoard = ChessBoard().setfromfen(
                    gameFull.initialFen == "startpos" ? null : gameFull.initialFen,
                    gameFull.variant.key
                )

                gameFull.initialFen = testBoard.fen

                state = gameFull.state

                this.writeBotChat(id, ["player", "spectator"], `Good luck, ${gameFull.opponentName} !`)                
                poweredBy()
            }

            if(event.type == "gameState") state = event

            if(gameFull && state){
                let board = ChessBoard().setfromfen(
                    gameFull.initialFen,
                    gameFull.variant.key
                )

                let allMovesOk = true

                let moves = state.moves.split(" ")

                if(state.moves){
                    for(let algeb of moves){
                        allMovesOk = allMovesOk && board.pushalgeb(algeb)
                    }
                }                

                let currentFen = board.fen

                if(allMovesOk){
                    this.botEventLogger.log(LogItem({text: `game ${id} board`, pre: board.toString(), cls: board.turn == gameFull.botTurn ? "green" : "blue"}))
                        
                    if(board.turn == gameFull.botTurn){
                        let lms = board.legalmovesforallpieces()

                        if(lms.length){
                            let reduceThinkingTime = parseInt(this.settings.reduceThinkingTimeCombo.selected)
                            let timecontrol = {
                                wtime:  state.wtime ? Math.floor(state.wtime / reduceThinkingTime) : 10000,
                                winc:   state.winc  || 0,
                                btime:  state.btime ? Math.floor(state.btime / reduceThinkingTime) : 10000,
                                binc:   state.binc  || 0,
                            }

                            if(timecontrol.wtime > HOUR) timecontrol.wtime = 10000
                            if(timecontrol.btime > HOUR) timecontrol.btime = 10000                            

                            if(this.settings.makeRandomBotMovesCheckbox.checked){
                                let selmove = lms[Math.floor(Math.random() * lms.length)]
                                let algeb = board.movetoalgeb(selmove)
                                this.playBotMove(id, board, moves, ratingDiff, null, null, "random", {bestmove: algeb, scorenumerical: null})
                            }else{
                                let bookalgeb = null

                                if(this.settings.useOwnBookCheckbox.checked){
                                    let weightIndices = this.settings.allowOpponentWeightsInBotBookCheckbox.checked ? [0, 1] : [0]
                                    bookalgeb = this.g.weightedAlgebForFen(currentFen, weightIndices)
                                }

                                ((
                                    this.settings.useBotBookCheckbox.checked ||
                                    ( this.settings.allowFallBackToBotBook.checked && (!bookalgeb) )
                                ) ?
                                    (requestLichessBook(
                                    currentFen,
                                    gameFull.variant.key,
                                    this.settings.lichessBookMaxMoves.selected,
                                    this.settings.lichessBookAvgRatingMultipleSelect.selected.map(opt => opt.value),
                                    this.settings.lichessBookTimeControlsMultipleSelect.selected.map(opt => opt.value)
                                )) : RP({moves: null})).then(result => {
                                    let bmoves = result.moves

                                    if(bmoves && bmoves.length){
                                        let grandTotal = 0

                                        for(let bmove of bmoves){
                                            bmove.total = bmove.white + bmove.draws + bmove.black
                                            grandTotal += bmove.total
                                        }

                                        let rand = Math.round(Math.random() * grandTotal)

                                        let currentTotal = 0

                                        for(let bmove of bmoves){
                                            currentTotal += bmove.total                                            
                                            if(currentTotal >= rand){
                                                bookalgeb = bmove.uci
                                                break
                                            }                                            
                                        }
                                    }

                                    if(bookalgeb){
                                        this.playBotMove(id, board, moves, ratingDiff, null, null, "book", {bestmove: bookalgeb, scorenumerical: null})
                                    }
                                    else{
                                        let moveOverHead = parseInt(this.settings.moveOverHeadCombo.selected)
                                        engine.play(gameFull.initialFen, state.moves, gameFull.variant.key, timecontrol, moveOverHead).then(
                                            this.playBotMove.bind(this, id, board, moves, ratingDiff, timecontrol, moveOverHead, "engine")
                                        )
                                    }
                                })                                
                            }                            
                        }
                    }
                }else{
                    this.botEventLogger.log(LogItem({text: `Could not parse moves in game ${id}.`, cls: "red"}))
                }
            }            
        }

        let processTermination = () => {
            this.botEventLogger.log(LogItem({text: `Game ${id} terminated.`, cls: "red large"}))
            this.writeBotChat(id, ["player", "spectator"], `Good game, ${gameFull.opponentName} !`)
            poweredBy()
            engine.terminate()
        }

        this.setInfoBar(`Playing game ${id} .`)

        let gameStateReader = new NdjsonReader(LICHESS_STREAM_GAME_STATE_URL + "/" + id, processGameEvent.bind(this), this.USER().accessToken, processTermination.bind(this))

        gameStateReader.stream()
    }

    playBotMove(id, board, moves, ratingDiff, timecontrol, moveOverHead, method, moveObj){
        let move = board.algebtomove(moveObj.bestmove)

        let offeringDraw = false

        if(move){
            let msg = `My ${method} move : ${board.movetosan(move)} .`

            let scorenumerical = 0

            let randPercent = Math.round(Math.random() * 100)

            if(!(moveObj.scorenumerical === null)){
                let scorenumerical = moveObj.scorenumerical
                msg += ` Score numerical cp : ${scorenumerical} .`                
                if(moves.length > 40){
                    if(ratingDiff > -200){
                        if(scorenumerical == 0){
                            offeringDraw = true
                        }
                        if(scorenumerical < 200){
                            if(randPercent < 10) offeringDraw = true
                        }
                    }
                }
            }

            if(offeringDraw) msg += " I would agree to a draw ."

            makeLichessBotMove(id, moveObj.bestmove, offeringDraw, this.USER().accessToken).then(result => {
                //this.botEventLogger.log(LogItem({text: "make move result", json: result}))
            })

            setTimeout(() => {                
                this.writeBotChat(id, ["player", "spectator"], msg)

                this.botEventLogger.log(LogItem({
                    text: msg,
                    json: {       
                        scorenumerical: scorenumerical,
                        randPercent: randPercent,             
                        movesLength: moves.length,                    
                        ratingDiff: ratingDiff,
                        offeringDraw: offeringDraw,
                        timecontrol: timecontrol,
                        moveOverHead: moveOverHead
                    },
                    cls: "green large"
                }))            
            }, 100)
        }else{
            this.botEventLogger.log(LogItem({text: `Could not find move. Making anyway ${moveObj.bestmove} .`, cls: "red"}))

            // try to make move anyway
            makeLichessBotMove(id, moveObj.bestmove, offeringDraw, this.USER().accessToken).then(result => {
                //this.botEventLogger.log(LogItem({text: "make move result", json: result}))
            })
        }
    }                            

    writeBotChat(id, rooms, msg){
        for(let room of rooms){
            writeLichessBotChat(id, room, msg, this.USER().accessToken).then(result => {
                //this.botEventLogger.log(LogItem({text: "chat result", json: result}))
            })
        }
    }

    processBotEvent(event){
        this.logBotEvent(event)

        if(event.type == "challenge"){
            let ok = true
            let status = "ok"

            let allowedVariants = this.settings.acceptBotVariantsTextAreaInput.text.split(" ")

            if(allowedVariants){
                if(!allowedVariants.includes(event.challenge.variant.key)){
                    ok = false
                    status = "wrong variant"
                }
            }

            if(event.challenge.timeControl.limit < 60){
                ok = false
                status = "initial clock < 60"
            }

            if(ok) acceptLichessChallenge(event.challenge.id, this.USER().accessToken).then(result => {                
                this.logBotEvent(result)                
            })
            else{
                this.botEventLogger.log(LogItem({text: status, cls: "red"}))

                declineLichessChallenge(event.challenge.id, this.USER().accessToken).then(result => {                
                    this.logBotEvent(result)                
                })
            }
        }

        if(event.type == "gameStart"){
            this.playGame(event.game.id)
        }
    }

    botStartUp(){        
        upgradeLichessBot(this.USER().accessToken).then(result => {            
            this.botInfoDiv.html(`Upgrade status : ${result.ok ? "ok ." : result.error}`)
        })

        this.challengeReader = new NdjsonReader(LICHESS_STREAM_EVENTS_URL, this.processBotEvent.bind(this), this.USER().accessToken)

        this.challengeReader.stream()
    }

    renderBotDiv(){
        return div().a(
            div().mar(5).a(
                this.botInfoDiv = div().mar(2).pad(2).bc("#eee"),
                this.botEventLogger = Logger({capacity: 10}).mar(2).pad(2)
            )
        )
    }

    apiPing(){
        api("api:ping", {}, response => {
            if(response.ok){
                this.lastApiTick = performance.now()
            }            
        })
    }

    checkApi(){
        if(performance.now() - this.lastApiTick > 20 * QUERY_INTERVAL){
            this.alert("Server not responsive. Reloading page.", "error")
            setTimeout(() => this.reloadPage(), ALERT_DELAY)
        }
    }

    reloadPage(){
        try{
            clearInterval(this.checkSourceInterval)
            clearInterval(this.apiPingInterval)
            clearInterval(this.checkApiInterval)
            this.source.close()
        }catch(err){console.log(err)}
        document.getElementById("root").innerHTML = ""
        document.getElementById("root").appendChild(div().mar(10).html("Reloading page ...").e)
        document.location.href = "/?reload=true" + ( PROPS.LOG_REMOTE ? "" : "&nolog=true" )
    }

    renderTrainDiv(){
        return div().a(
            div().mar(5).a(
                this.trainModeMultipleSelect = MultipleSelect({
                    id: `trainModeMultipleSelect`,                    
                    display: `Training`,                    
                    radio: true,
                    forceOptions: true,
                    options: [
                        {value: "off", display: "Off"},
                        {value: "white", display: "White"},
                        {value: "black", display: "Black"}
                    ],
                    width: 220,
                    hideDeleteButton: true,
                    hideAddButton: true,
                    settings: this.settings,
                    changeCallback: this.trainChanged.bind(this)
                }),
                Labeled("Remain at leaf", CheckBoxInput({
                        id: "remainAtLeafCheckbox",                    
                        display: "Remain at leaf",                                                                
                        settings: this.settings
                }), {
                    fs: 16
                }),
            )
        )
    }

    trainChanged(){
        if(this.trainOn){
            if(this.trainMode == "off") this.trainOn = false
        }else{
            if(this.trainMode != "off"){
                this.trainOn = true
                this.trainRoot = this.getcurrentnode()
            }
        }        
        
        if(this.trainMode == "white") this.g.flip = false
        if(this.trainMode == "black") this.g.flip = true

        this.board.draw()
        this.positionchanged()
    }

    loadLichessUsers(){        
        IDB.getAll("user").then(result => {
            if(result.ok){
                this.lichessusers = result.content                
            }else{
                this.lichessusers = []                
            }
            this.renderLichessUsers()
        })
    }

    raiok(rai){
        if(!rai) return false
        return ( rai.analysisinfo.analysiskey == this.board.analysiskey() )
    }

    showAnalysisinfo(){        
        let text = "--> no analysis available"        

        this.board.analysisinfoDiv = this.analysisinfoDiv
    
        if(this.raiok(this.rai) && this.raiok(this.storedrai)){
            if(this.storeOk()){
                text = this.rai.asText()
                this.board.highlightrichanalysisinfo(this.rai)
            }else{
                text = ( this.shouldGo ? this.rai.asText() + "\n" : "" ) + this.storedrai.asText()
                this.board.highlightrichanalysisinfo(this.storedrai)
            }
        }else if(this.raiok(this.storedrai)){
            text = this.storedrai.asText()
            this.board.highlightrichanalysisinfo(this.storedrai)
        }else if(this.raiok(this.rai)){
            text = this.rai.asText()
            this.board.highlightrichanalysisinfo(this.rai)             
        }

        this.gametext.setValue(text)                
    }

    storeOk(){
        if(!this.raiok(this.rai)) return false        
        if(!this.raiok(this.storedrai)) return true
        return (this.storedrai.analysisinfo.lastcompleteddepth <= this.rai.analysisinfo.lastcompleteddepth)
    }

    processanalysisinfo(analysisinfo){
        this.rai = new RichAnalysisInfo(analysisinfo).live(true)

        IDB.get("engine", this.board.analysiskey()).then(result => {
            this.storedrai = result.hasContent ? new RichAnalysisInfo(result.content) : null

            this.showAnalysisinfo()

            this.gobutton.bc(this.rai && this.rai.running ? IDLE_BUTTON_COLOR : GREEN_BUTTON_COLOR)
            this.stopbutton.bc(this.rai && this.rai.running ? RED_BUTTON_COLOR : IDLE_BUTTON_COLOR)

            if(this.storeOk()) IDB.put("engine", this.rai.analysisinfo)
        })
    }

    go(){
        this.shouldGo = true
        localStorage.setItem("shouldGo", "true")

        let payload = {            
            variant: this.variant,
            multipv: parseInt(this.settings.multipvCombo.selected) || DEFAULT_MULTIPV,
            fen: this.fen,
        }

        if(this.settings.useServerStockfishCheckbox.checked){
            payload.password = this.askPass()
            
            payload.threads = parseInt(this.settings.threadsCombo.selected) || DEFAULT_THREADS,

            api("engine:go", payload, response => {
                this.clog(response)
            })
        }else{            
            this.engine.setcommand("go", payload)
        }
    }

    stop(){
        this.shouldGo = false
        localStorage.removeItem("shouldGo")

        if(this.settings.useServerStockfishCheckbox.checked){
            api("engine:stop", {
                password: this.askPass(),
            }, response => {
                this.clog(response)
            })
        }else{            
            this.engine.setcommand("stop")
        }        
    }

    deleteAnalysis(){        
        IDB.delete("engine", this.board.analysiskey()).then(result => {                        
            this.board.positionchanged()
        })
    }

    moveClicked(lm, ev){
        this.board.makeMove(lm)
        if(ev.button) this.board.back()
    }

    weightChanged(index, lm, value){        
        this.g.makemove(lm)
        this.getcurrentnode().weights[index] = parseInt(value)
        this.g.back()        
        this.positionchanged()
    }

    highlightDrawings(){
        this.board.highlightDrawings()
    }

    commentChanged(value, show){        
        this.getcurrentnode().comment = value

        if(show){
            this.positionchanged()
            this.doLater("highlightDrawings", HIGHLIGHT_DRAWINGS_DELAY)
        }
        else{
            this.doLater("storeDefault", STORE_DEFAULT_DELAY)
            this.doLater("highlightDrawings", HIGHLIGHT_DRAWINGS_DELAY)
        }
    }

    gameClicked(game, mergeAll, ev){                
        this.lastClickedGameId = game.id
        localStorage.setItem("lastClickedGameId", this.lastClickedGameId)

        this.buildGames()

        if(ev) if(ev.button){
            window.open(lichessGameUrl(game.id))
        }

        this.g.flip = game.meBlack        

        this.mergeMoveList(game.moves, mergeAll)

        this.tabs.selectTab("moves")

        this.setInfoBar(game.summary)
    }

    setInfoBar(message){
        this.mainPane.headDiv
        .x()        
        .a(
            div()
                .c("#070")
                .fwb()
                .marl(10)
                .html(this.selectedStudy.title)
            ,
            div()  
                .marl(10)              
                .html(message || "")
        )
    }

    buildGames(){        
        let i = 0
        this.gamesListDiv
            .miw(4000).mah(window.innerHeight - 150).ovfy("auto").dir("rtl")
            .pad(2).bc("#add").x().a(div().dir("ltr").a(
            this.games.map(game => div().sa("id", game.id)
                .mart(3).c("#00f")
                .bc(game.id == this.lastClickedGameId ? "#0f0" : (i++ % 2 ? "#dfdff0" : "#e0efe0"))
                .a(
                div()
                    .pad(1)
                    .html(game.summarypadded)
                    .cp().ae("mousedown", this.gameClicked.bind(this, game, !MERGE_ALL_MOVES)),
                div().marl(60).fs(12).c("#707").bdr("solid", 1, "#777").pad(1)
                    .html(game.moves.join(" "))
                    .cp().ae("mousedown", this.gameClicked.bind(this, game, MERGE_ALL_MOVES))
            ))
        ))
        this.loadTimeDiv.html(`load time ${Math.round(this.gamesLoadTime / 1000)} sec(s)`).show(this.gamesLoadTime)

        if(this.lastClickedGameId)
            setTimeout(() => {
                try{
                    document.getElementById(this.lastClickedGameId).scrollIntoView(), 50
                }catch(err){}
            })
    }

    USER(){
        return PROPS.USER || {}
    }

    username(){
        return this.USER().id || DEFAULT_USERNAME
    }

    fetchGames(){
        return P(resolve => {
            this.games = []
            this.gamesLoadTime = null
            this.buildGames()

            let fetchStarted = performance.now()

            getLichessGames(
                this.username(),
                {
                    max: parseInt(this.settings.fetchMaxGamesCombo.selected)
                },
                this.USER().accessToken
            ).then(result => {
                if(result.ok){        
                    this.gamesLoadTime = performance.now() - fetchStarted
                    this.games = result.content.map(game => LichessGame(game, this.username()))
                    this.buildGames()
                    resolve(true)
                }
            })
        })        
    }

    confirmDeleteMove(){
        let treeSize = this.g.subtreeSize()

        if(treeSize > DELETE_MOVE_WARN_LIMIT){
            return confirm(`Are you sure you want to delete ${treeSize} moves?`, "delete")
        }

        return true
    }

    deleteLegalMove(lm, ev){        
        ev.preventDefault()        
        
        this.board.makeMove(lm)

        if(!this.confirmDeleteMove()){
            this.board.back()
            return
        }

        this.board.del()
    }

    delMove(){
        if(!this.confirmDeleteMove()){            
            return
        }

        this.board.del()
    }

    addLegalMove(lm, i, ev){        
        ev.preventDefault()
        this.board.makeMove(lm)
        if(i < 0) this.getcurrentnode().weights = [0, 0]
        else{
            this.getcurrentnode().weights[i] = 5        
            this.getcurrentnode().weights[1 - i] = 0
        }
        if(ev.button) this.board.back()
    }

    createNodeForLegalMove(lm){
        let priority = lm.gameNode ? lm.gameNode.priority : 0
        let moveDiv = div()            
            .ac(priority ? "blink_me" : "dummy")
            .ac("unselectable")
            .ffm().dfc().a(                                
            div()
                .cp().bc(lm.gameMove ? movecolor(lm.gameNode.weights) : "#eee")
                .fwb()
                .pad(1).mar(1).w(60).fs(16).html(lm.san)
                .ae("click", this.moveClicked.bind(this, lm)),
            [0,1].map(index =>
                Combo({
                    changeCallback: this.weightChanged.bind(this, index, lm),
                    selected: lm.gameNode ? lm.gameNode.weights[index] : 0,
                    options: Array(11).fill(null).map((_,i) => ({value: i, display: i}))
                }).mar(1)
            ),
            Button("me", this.addLegalMove.bind(this, lm, 0)).bc(GREEN_BUTTON_COLOR).fs(10),
            Button("opp", this.addLegalMove.bind(this, lm, 1)).bc(YELLOW_BUTTON_COLOR).fs(10),
            Button("n", this.addLegalMove.bind(this, lm, -1)).bc(IDLE_BUTTON_COLOR).fs(10),
            Button("X", this.deleteLegalMove.bind(this, lm)).bc(RED_BUTTON_COLOR).fs(10),
            div().c("#00b")
                .tac().fs(11).ww(30)
                .html(lm.gameNode ? "" + this.g.subtreeSize(lm.gameNode) : "-")
        )

        let decorateDiv = lm.decorate ?
            div().a(
                div().marb(1).op(0.5).addStyle("width", lm.decorate.perfpercent + "%").h(10).bc("#007"),
                div().pad(2).bc("#aaa").ffm().dfca().a(
                    div().html("w"),
                    div().ww(70).tac().bc("#fff").html("" + lm.decorate.white),
                    div().html("d"),
                    div().ww(70).tac().bc("#ffa").html("" + lm.decorate.draws),
                    div().html("b"),
                    div().ww(70).tac().bc("#000").c("#fff").html("" + lm.decorate.black),
                ),
            )
        :
            div()

        let evalDiv = div().bc("#eee")

        if(lm.gameNode) if(lm.gameNode.hasEval){
            let evl = -lm.gameNode.eval
            evalDiv.a(                
                div().marb(2).ffm().fwb().c(scoretorgb(evl)).html(`${evl > 0 ? "+" : ""}${evl}`)
            )
        }

        return div().pad(2).padb(4).bdr("solid", 1, "#00a").a(
            moveDiv,
            evalDiv,
            decorateDiv,            
        )
    }

    buildMoves(decorateOpt){        
        this.decorate = decorateOpt || this.decorate

        let lms = this.board.getlms(RICH, this.decorate ? ( this.decorate.fen == this.fen ? this.decorate : null ) : null).sort((a,b) => a.san.localeCompare(b.san))                

        lms.sort((a,b) => b.evalWeight - a.evalWeight)

        lms.sort((a,b) => (b.sortweight - a.sortweight))

        this.movesDiv.x().ame(
            div().hh(this.board.boardsize() - 5).df().a(
                div().ovfys().a(
                    lms.map(lm => this.createNodeForLegalMove(lm))
                ),
                this.analysisinfoDiv,
                div().a(                    
                    this.commentTextArea = TextAreaInput({
                        text: this.getcurrentnode().comment,
                        changeCallback: this.commentChanged.bind(this)
                    })
                        .fs(16).w(COMMENT_TEXT_AREA_WIDTH).addStyle("height", "calc(100% - 34px)"),
                    div().pad(2).a(
                        Button("Delete", this.commentChanged.bind(this, "", SHOW_COMMENT)).bc(RED_BUTTON_COLOR),
                    ),                    
                ),
            ),
            this.pgnText = TextAreaInput()
                .mart(4).w(GAME_TEXT_AREA_WIDTH).h(GAME_TEXT_AREA_HEIGHT - 3)
                .ae("paste", this.pgnPasted.bind(this))
                .ae("dblclick", this.pgnClicked.bind(this)),
            )

        this.pgnText.setValue(this.g.line())

        this.commentTextArea.focus()
    }

    pgnClicked(){
        let pgn = this.pgnText.value()
        let moveListIndex = pgn.indexOf("\n\n")
        let curpos = this.pgnText.e.selectionStart
        let moveListStr = pgn.substring(moveListIndex+2, curpos)        
        this.mergeMoveListStr(moveListStr, MERGE_ALL_MOVES)
    }

    mergeMoveList(moves, mergeAll){
        if(!mergeAll) moves = moves.slice(0, Math.min(moves.length, parseInt(this.settings.mergeDepthCombo.selected)))

        let game = Game({variant: this.variant}).fromsans(moves)

        this.alert(this.g.merge(game), "info")                

        this.board.positionchanged()
    }

    mergeMoveListStr(content, mergeAll){
        let moves = content.split(/ |\./).filter(item=>item.match(/^[a-zA-Z]/))        

        this.mergeMoveList(moves, mergeAll)
    }

    pgnPasted(ev){
        ev.preventDefault()

        let content = ev.clipboardData.getData('Text')        

        this.mergeMoveListStr(content)
    }

    nodeClicked(node){
        this.board.setfromnode(node)
    }

    buildTree(node, rgbopt, depth, maxdepth){
        if(depth > maxdepth) return div().html("...")
        
        let current = node.id == node.parentgame.currentnodeid

        let rgb = rgbopt || randrgb()        
        if(node.childids.length > 1) rgb = randrgb()

        let captionDiv = div()
            .w(node.gensan ? 60 : 600).cp().pad(2).mar(1)
            .bdr("solid", 3, current ? "#0f0" : "#ddd")
            .bc(node.gensan ? node.turn() ? "#000" : "#fff" : "#0d0")
            .c(node.turn() ? "#fff" : "#000").tac()
            .html(node.gensan ? `${node.fullmovenumber()}. ${node.gensan}` : `${this.fen}`)
            .ae("click", this.nodeClicked.bind(this, node))

        let nodeDiv = div()
            .dfcc().mar(rgb == rgbopt ? 0 : 3)
            .ac("unselectable").bc(rgb)
            .miw(depth ? 0 : TREE_WIDTH)                                    
            .a(
                captionDiv,
                div()
                    .df()
                    .a(
                        node.sortedchilds().map(child =>
                            this.buildTree(child, rgb, depth + 1, maxdepth)
                    )
            )
        )        

        if(current){
            this.currentNodeTreeDiv = nodeDiv
            this.currentNodeCaptionDiv = captionDiv
        }

        return nodeDiv
    }

    showTree(){
        seed = TREE_SEED

        let maxdepth = parseInt(this.settings.treeBackwardDepthCombo.selected) + parseInt(this.settings.treeMaxDepthCombo.selected)        

        let node = this.getcurrentnode()

        for(let i = 0; i < parseInt(this.settings.treeBackwardDepthCombo.selected); i++){
            if(node.getparent()){
                node = node.getparent()                
            }
        }        

        this.treeDiv.x().a(
            this.buildTree(node, null, 0, maxdepth)
        )

        this.treeDiv.resize()
    }

    storeDefault(){        
        this.storeStudy("Default", this.g)
    }

    positionchanged(){
        this.rai = null
        this.storedrai = null
        this.board.clearanalysisinfo()
        this.showAnalysisinfo()

        if(this.shouldGo){            
            this.go()
        }else{
            IDB.get("engine", this.board.analysiskey()).then(dbResult => {
                if(dbResult.hasContent){                    
                    this.storedrai = new RichAnalysisInfo(dbResult.content)
                    this.showAnalysisinfo()
                }
            })
        }

        if(!this.settings.disableLichessBookCheckbox.checked) this.requestLichessBook()
        else this.decorate = null

        this.doLater("buildMoves", POSITION_CHANGED_DELAY)
        this.doLater("showTranspositions", POSITION_CHANGED_DELAY)
        this.doLater("showTree", 2 * POSITION_CHANGED_DELAY)
        this.doLater("buildAnimsDiv", POSITION_CHANGED_DELAY)
        this.doLater("showFilterBook", 2 * POSITION_CHANGED_DELAY)
        this.doLater("showChart", POSITION_CHANGED_DELAY)
        this.doLater("storeDefault", STORE_DEFAULT_DELAY)

        if(this.trainMode == this.b.reverseTurnVerbal){
            let childs = this.getcurrentnode().sortedchilds()
            let randBuff = []
            childs.forEach(child => randBuff = randBuff.concat(Array(child.weights[0] + child.weights[1]).fill(child.gensan)))

            if(!randBuff.length) return this.trainingLineCompleted()

            let selsan = randBuff[Math.floor(Math.random() * randBuff.length)]
            let move = this.b.santomove(selsan)
            this.board.makeMove(move)
        }
    }

    transpositionClicked(transp){
        this.tabs.selectTab("moves")
        this.board.setfromnode(transp)
    }

    renderTransposition(transp){
        return div()
            .mar(2).pad(2).ffm().cp()
            .bc(this.getcurrentnode().id == transp.id ? "#afa" : "#eee")
            .html(this.g.line(!DO_COMMENTS, transp))
            .ae("mousedown", this.transpositionClicked.bind(this, transp))
    }

    showTranspositions(){
        let transps = this.g.transpositions()
        this.transpositionsTab.setAlert(transps.length > 1 ? "" + transps.length : "")
        this.transpositionsDiv.x().a(div().mar(5).a(
            transps.map(transp => this.renderTransposition(transp))
        ))
    }

    trainingLineCompleted(){
        this.alert("Training line completed.", "success")
        if(this.g.currentnodeid != this.trainRoot.id){
            if(this.settings.remainAtLeafCheckbox.checked){
                this.trainModeMultipleSelect.selectById("off")
                this.tabs.selectTab("moves")
            }else{
                this.board.setfromnode(this.trainRoot)
            }            
        }
    }

    requestLichessBook(){
        requestLichessBook(
            this.fen,
            this.variant,
            this.settings.lichessBookMaxMoves.selected,
            this.settings.lichessBookAvgRatingMultipleSelect.selected.map(opt => opt.value),
            this.settings.lichessBookTimeControlsMultipleSelect.selected.map(opt => opt.value)
        ).then(result => this.buildMoves(result))
    }

    showChart(){                
        this.chartDiv.x().por()

        if(!this.filteredgames) return
        if(!this.filteredgames.length) return        

        this.chartCanvas = Canvas({
            width: window.innerWidth - this.board.boardsize() - 40,
            height: window.innerHeight - 120
        })

        this.chartDiv.a(div().marl(10).poa().a(this.chartCanvas))

        let datagames = this.filteredgames.slice().reverse()
        let data = datagames.map(lg => lg.myRating)        

        new Chart(this.chartCanvas.e, {
            type: "line",                        
            data: {
                labels: Array(data.length).fill(null).map((_,i) =>
                    Math.floor((datagames[i].orig.createdAt - datagames[0].orig.createdAt) / DAY)
                ),
                datasets: [
                    {
                        label: "Rating",
                        backgroundColor: "#afa",
                        data: data
                    }
                ]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,                
                title: {
                    display: true,
                    text: this.filterEditableList.state.selected ? this.filterEditableList.state.selected.display : "Chart",
                }
            }
        })
    }

    renderBookgamesPages(){
        this.bookgamesPages.list = this.bookgames        
        this.filterBookPagesDiv.x().a(this.bookgamesPages.render(0))
    }

    showFilterBook(){
        if(!this.filteredgames) return
        this.bookgames = this.filteredgames.filter(lg => (lg.positions || []).find(fen =>
            strippedfen(fen) == strippedfen(this.fen)))

        this.renderBookgamesPages()

        if(this.bookWorkerTimeout) clearTimeout(this.bookWorkerTimeout)        
        this.bookWorkerTimeout = setTimeout(() =>
            this.bookWorker.postMessage({
                action: "createBook",
                bookgames: this.bookgames.map(lg => {
                    lg.orig.positions = lg.positions
                    lg.orig.myResult = lg.myResult
                    return lg.orig
                }),
                fen: this.fen,
                variant: this.variant
            }),
            SHOW_FILTER_BOOK_TIMEOUT
        )
    }

    bookMoveClicked(bm){
        if(bm.fen != this.fen) return
        this.board.makeMove(this.b.santomove(bm.san))
    }

    renderFilterBook(data){        
        let bookmoves = data.bookmoves
        let fen = data.fen
        let buildtime = data.buildtime
        this.filterBookContentDiv.x()
        if(fen != this.fen) return

        this.filterBookContentDiv.a(div().mar(5).html(`Build time : ${Math.round(buildtime / 1000)} sec(s) .`))

        this.filterBookContentDiv.a(table().fs(20).sa("cellpadding", 5).a(bookmoves.map(bm => tr().a(
            td().html(bm.san).cp().ae("mousedown", this.bookMoveClicked.bind(this, bm)),
            td().tac().html("" + bm.plays).c("#007"),
            td().tac().html("" + bm.wins).c("#070"),
            td().tac().html("" + bm.draws).c("#770"),
            td().tac().html("" + bm.losses).c("#700"),
            td().tac().html("" + bm.perf + "%").c("#077"),
        ))))
    }

    clog(msg){
        if(IS_DEV()) console.log(msg)
    }

    checksource(){
        let elapsed = performance.now() - this.lasttick

        if(elapsed > ( 2 * QUERY_INTERVAL ) ){
            this.alert(`Engine stream timed out, setting up new. If the problem persists, reload the page.`, "error")

            this.lasttick = performance.now()

            this.setupsource()
        }
    }

    setupsource(){
        try{
            this.setupsourceFunc()
        }catch(err){
            this.alert(`Could not set up engine stream. If the problem persists, reload the page.`, "error")
        }
    }

    setupsourceFunc(){
        this.clog(`setting up event source with interval ${QUERY_INTERVAL} ms`)        

        this.source = new EventSource('/stream')

        this.source.addEventListener('message', e => {
            let analysisinfo = JSON.parse(e.data)            
            if(analysisinfo.kind == "tick"){
                this.lasttick = performance.now()
            }else{
                this.processanalysisinfo(analysisinfo)
            }            
        }, false)

        this.source.addEventListener('open', _ => {            
            this.clog("connection opened")
        }, false)

        this.source.addEventListener('error', e => {
            if (e.readyState == EventSource.CLOSED) {                
                this.clog("connection closed")
            }
        }, false)

        this.lasttick = performance.now()
    }

    loadStudy(study){
        return P(resolve =>
            IDB.get("study", study).then(result => {            
                if(result.hasContent){                
                    this.board.setgame(Game().fromblob(result.content.game))                
                    resolve([`Loaded study " ${study} " .`, "success"])
                }else{
                    resolve([`Cannot load study " ${study} " . It is not saved yet in database .`, "info"])
                }
            })
        )        
    }

    storeStudy(title, game){
        return IDB.put("study", {
            title: title,
            game: game.serialize()
        })   
    }

    alert(msgOpt, kindOpt){        
        let msg = msgOpt || "Alert."
        let kind = kindOpt || "info"

        if(typeof msgOpt == "object"){
            msg = msgOpt[0]
            kind = msgOpt[1]
        }

        this.alertDiv.show(true).x().a(div()
            .w(600).pad(10).zi(1000).tac()
            .bdr("solid", 5, "#777", 10)
            .ac("alert")
            .ac(kind)
            .html(msg)
        )

        this.doLater("hideAlert", ALERT_DELAY)
    }

    hideAlert(){
        this.alertDiv.show(false)
    }

    deleteImage(name){
        IDB.delete("image", name).then(_ => this.showImages())
    }

    renderThumb(item){
        return div().mar(3).dib().pad(3).bc("#aff").a(
            div().dfcc().a(
                div().html(item.name),
                Button(`Add to frame`, this.addImageToFrame.bind(this, item.name)).bc(GREEN_BUTTON_COLOR),
                Button(`Delete ${item.name}`, this.deleteImage.bind(this, item.name)).bc(RED_BUTTON_COLOR),
                Img({src: item.imgsrc, width: THUMB_SIZE, height: THUMB_SIZE})
            )
        )
    }

    showImages(){
        this.imageDiv.x()
            .a(div().marl(10).mart(6)
            .html("Images loading ..."))

        IDB.getAll("image").then(result => {
            if(result.ok){
                this.imageDiv.x().a(
                    div()
                    .miw(600).mih(600).bc("#777")
                    .dropLogic(this.imageDropped.bind(this)).a(
                        result.content.map(item => this.renderThumb(item))
                    )                    
                )
            }
        })
    }

    getcurrentnode(){
        return this.board.getcurrentnode()
    }

    addImageToFrame(name){
        this.getcurrentnode().addImageToComment(name, 10000)
        this.positionchanged()
    }

    uploadImage(content, nameorig){
        let canvas = this.board.getCanvasByName("dragpiece")

        canvas.drawImageFromSrc(content, Vect(80, 120)).then(() => {                    
            let offername = nameorig.replace(REMOVE_IMAGE_EXTENSION_REGEXP, "")
            let name = window.prompt("Image name : ", offername)

            IDB.put("image", {
                name: name,
                imgsrc: content
            }).then(result => {
                if(result.ok){
                    this.alert(`Image ${name} stored.`, "success")
                    this.showImages()
                    setTimeout(function(){canvas.clear()}.bind(this), ALERT_DELAY)
                }else{
                    this.alert(`Storing image ${name} failed.`, "error")
                }
            })  
        })
    }

    dropImages(files){
        let file = files[0]

        readFile(file, "readAsDataURL").then(event => {
            let content = event.target.result            
            this.uploadImage(content, file.name)
        })  
    }

    imageDropped(ev){
        this.dropImages(ev.dataTransfer.files)
    }

    addAnimationCallback(){                
        let [ value, display ] = [
            this.g.currentnodeid + "_" + UID(),
            "Animation " + this.g.line()
        ]

        display = window.prompt("Animation name : ", display)

        this.alert(`Added animation ${display} under id ${value}.`, "success")

        return [ value, display ]
    }

    animsChanged(selected, options){
        this.g.animations = options
        this.g.selectedAnimation = selected

        this.buildAnimsDiv()

        this.doLater("storeDefault", STORE_DEFAULT_DELAY)
    }

    addSelAnimationCallback(){
        return [
            this.g.currentnodeid,
            "root " + this.g.line()
        ]
    }

    selAnimChanged(selected, options){
        this.g.animationDescriptors[this.g.selectedAnimation.value] = {
            selected: selected,
            list: options
        }                                

        try{
            this.board.setfromnode(this.g.gamenodes[selected.value])
        }catch(err){
            this.positionchanged()
        }
    }

    playAnimation(task){
        if(this.recordAnimation){
            if(this.recordAnimationCycle > 1){
                this.recordAnimation = false
                task = stop
                this.render()
            }
        }

        if(task == "record"){            
            this.moveAnimationForward({task: "toend"})            
            this.recordAnimation = true            
            this.initgif()
            this.recordAnimationCycle = 0
            task = "play"
        }

        let stopfunc = function(){
            if(this.playtimeout){
                clearTimeout(this.playtimeout)
                this.playtimeout = null
            }
            this.recordAnimation = false
        }.bind(this)

        if(task == "play"){            
            let contfunc = function(maf){
                if(maf){                
                    this.playtimeout = setTimeout(this.playAnimation.bind(this, "play"), PLAY_ANIMATION_DELAY)
                }                
                else{
                    stopfunc()
                }
            }.bind(this)   

            let maf = this.moveAnimationForward()

            if(typeof maf == "boolean"){
                contfunc(maf)
            }else{                
                maf.then(maf => contfunc(maf))
            }
        }

        if(task == "stop") stopfunc()
    }

    buildAnimsDiv(){
        let selanim = this.g.selectedAnimation
        let anims = this.g.animations

        this.animsEditableList = EditableList({
            id: "animseditablelist",
            changeCallback: this.animsChanged.bind(this),
            addOptionCallback: this.addAnimationCallback.bind(this),
            forceSelected: selanim,
            forceOptions: anims,
            width: 500,
            forceZIndex: 20
        }).mar(5)

        this.animsDiv.x().a(            
            div().a(
                Button("Step", this.moveAnimationForward.bind(this)).mar(5).bc(BLUE_BUTTON_COLOR),
                Button("Play", this.playAnimation.bind(this, "play")).mar(5).bc(BLUE_BUTTON_COLOR),
                Button("Stop", this.playAnimation.bind(this, "stop")).mar(5).bc(RED_BUTTON_COLOR),
                Button("Record", this.playAnimation.bind(this, "record")).mar(5).bc(GREEN_BUTTON_COLOR)
            ),
            this.animsEditableList
        )

        if(selanim){
            let animdesc = this.g.animationDescriptors[selanim.value]            

            this.selAnimEditableList = EditableList({
                id: "selanimeditablelist",
                changeCallback: this.selAnimChanged.bind(this),
                addOptionCallback: this.addSelAnimationCallback.bind(this),
                forceSelected: animdesc ? animdesc.selected : null,
                forceOptions: animdesc ? animdesc.list : [],
                width: 500,
                forceZIndex: 10,
                dontRollOnSelect: true
            }).mar(10)

            this.animsDiv.a(
                this.selAnimEditableList
            )
        }

        this.animsDiv.ame()
    }

    record(){return P(resolve => {
        let bs = this.board.boardsize()
        let props = this.getcurrentnode().props()

        let canvas = Canvas({width: 2 * bs, height: bs})

        canvas.fillStyle("#FFFFFF")
        canvas.fillRect(Vect(0,0), Vect(2*bs,bs))
        
        canvas.ctx.drawImage(this.board.getCanvasByName("background").e, 0, 0)
        canvas.ctx.globalAlpha = 0.3
        canvas.ctx.drawImage(this.board.getCanvasByName("square").e, 0, 0)
        canvas.ctx.globalAlpha = 1
        if(this.settings.highlightanimationmovesCheckbox.checked)
            canvas.ctx.drawImage(this.board.getCanvasByName("highlight").e, 0, 0)
        canvas.ctx.drawImage(this.board.getCanvasByName("piece").e, 0, 0)
        canvas.ctx.drawImage(this.board.getCanvasByName("drawings").e, 0, 0)

        let finalizefunc = _ => {
            canvas.ctx.drawImage(this.board.commentcanvas.e, bs, 0)

            canvas.ctx.textBaseline = "top"            
            this.commentfontsize = bs / 12
            this.commentmargin = this.commentfontsize / 3            
            canvas.ctx.font = `${this.commentfontsize / 1.5}px serif`
            canvas.ctx.fillStyle = "#00FF00"                

            canvas.renderText("animation created by", bs - 2 * this.commentmargin, this.commentfontsize * 1.1, bs + this.commentmargin, bs - 2 * this.commentfontsize/1.1)

            canvas.ctx.font = `${this.commentfontsize / 1.3}px serif`
            canvas.ctx.fillStyle = "#0000FF"                

            canvas.renderText("https://easychess.herokuapp.com", bs - 2 * this.commentmargin, this.commentfontsize * 1.1, bs + this.commentmargin, bs - this.commentfontsize)

            this.gif.addFrame(canvas.e, {delay: props.delay || DEFAULT_FRAME_DELAY})

            resolve(true)
        }

        let drawings = this.getcurrentnode().drawings()

        let imageName = null
        let drawing = null
        for(let drw of drawings){
            if(drw.kind == "image"){                    
                imageName = drw.name
                drawing = drw                    
                break
            }
        }

        if(imageName){
            IDB.get("image", imageName).then(
                result => {
                    if(result.hasContent){
                        canvas.ctx.globalAlpha = drawing.opacity / 9

                        let ds = bs * drawing.thickness / 9
                        let dm = ( bs - ds ) / 2

                        canvas.drawImageFromSrc(result.content.imgsrc, Vect(bs + dm, dm), Vect(ds, ds)).then(_ => {
                            canvas.ctx.globalAlpha = 1
                            finalizefunc()
                        })                            
                    }else{
                        finalizefunc()
                    }
                },
                _ => finalizefunc()
            )
        }else{
            finalizefunc()
        }
    })}

    render(){
        this.gif.render()
    }

    moveAnimationForward(argOpt){
        let arg = argOpt || {}

        let selanim = this.g.selectedAnimation

        if(selanim){
            let animdesc = this.g.animationDescriptors[selanim.value]

            if(animdesc) if(animdesc.selected) if(animdesc.list) if(animdesc.list.length){
                let selnodeid = animdesc.selected.value
                let i = animdesc.list.findIndex(opt => opt.value == selnodeid)

                if((i>=0)){
                    if(arg.task == "toend"){                        
                        i = animdesc.list.length - 1
                    }else{
                        i++
                        if(i >= animdesc.list.length) i = 0                                        
                    }                   

                    animdesc.selected = animdesc.list[i]
                    selnodeid = animdesc.list[i].value                    
                    this.board.setfromnode(this.g.gamenodes[selnodeid])                    

                    if(this.recordAnimation){
                        if(i==0) this.recordAnimationCycle++
                        if(this.recordAnimationCycle < 2){
                            return this.record()
                        }
                    }

                    return true
                }
            }
        }        

        return false
    }

    loginWithLichess(){
        document.location.href = LICHESS_LOGIN_URL
    }

    loginWithLichessBot(){
        document.location.href = LICHESS_BOT_LOGIN_URL
    }

    createBackupBlob(){return P(resolve => {
        let obj = {
            localStorageEntries: Object.entries(localStorage)
                .filter(entry => entry[0] != PASSWORD_KEY)
                .filter(entry => !(entry[0].match(/liapi/)))
        }

        IDB.getAlls(BACKUP_STORAGES).then(result => {
            obj.indexedDB = result
            resolve(obj)
        })
    })}

    createZippedBackup(){return P(resolve => {
        this.createBackupBlob().then(blob => {
            resolve(createZip(JSON.stringify(blob)))
        })
    })}

    askPass(){
        let storedPass = localStorage.getItem(PASSWORD_KEY)

        if(storedPass) return storedPass

        let password = window.prompt("Password : ")

        if(password){
            localStorage.setItem(PASSWORD_KEY, password)
            return password
        }

        return "none"        
    }

    showBackup(){
        this.createZippedBackup().then(
            content => this.backupTextArea.setCopy(content)
        )
    }

    setFromBackup(content){
        unZip(content).then(blobstr => this.setFromBackupBlobStr(blobstr))
    }

    async setFromBackupBlobStr(blobstr){        
        let blob = JSON.parse(blobstr)
        let i = 0

        for(let entry of blob.localStorageEntries){
            localStorage.setItem(entry[0], entry[1])
            i++
        }

        this.alert(`Set ${i} localStorage item(s).`, "info")

        let si = 0
        let ki = 0                
    
        for(let store in blob.indexedDB){                                
            for(let obj of blob.indexedDB[store].content){                                                            
                await IDB.put(store, obj)
                ki++
                if((ki % 100)==0)
                    this.alert(`Set ${ki} indexedDB object(s).`, "info")
            }
            si ++
        }

        this.alert(`Restored ${i} localStorage item(s), ${si} indexedDB store(s), ${ki} indexedDB object(s).`, "success")

        setTimeout(() => document.location.reload(), ALERT_DELAY)
    }

    backupPasted(ev){
        let content = ev.clipboardData.getData('Text')        

        this.backupTextArea.setCopy(content)

        this.setFromBackup(content)
    }

    setPassword(){
        localStorage.removeItem(PASSWORD_KEY)

        this.askPass()
    }

    backupRemote(){
        this.createZippedBackup().then(content =>
            api("bucket:put", {
                content: content,
                password: this.askPass()
            }, response => {
                if(response.ok){
                    this.alert(`Backup done. Size ${response.apiResponse.size}`, "success")
                }else{
                    this.alert(`Backup failed. ${response.error}`, "error")
                }
            })
        )
    }

    restoreRemote(){
        api("bucket:get", {
            password: this.askPass()
        }, response => {            
            if(response.ok){
                this.setFromBackup(response.content)
            }
        })
    }

    backupLocal(){
        this.createZippedBackup().then(content => {
            downloadcontent(content)
        })
    }

    backupGit(){
        this.createZippedBackup().then(content => {
            api("git:put", {
                content: content,
                password: this.askPass()
            }, response => {
                if(response.ok){
                    this.alert(`Uploaded to git.`, "success")
                }else{
                    this.alert(`${response.error}`, "error")
                }
            })
        })
    }

    backupDropped(ev){
        let file = ev.dataTransfer.files[0]
        
        readFile(file, "readAsText").then(event => {
            let content = event.target.result            
            this.setFromBackup(content)
        })
    }

    restoreGit(){
        fetch(BACKUP_FETCH_URL).then(
            response => response.text().then(
                content => {
                    this.setFromBackup(content)
                },
                _ => {                                        
                    this.alert("Error: Response content could not be obtained.", "error")
                }
            ),
            _ => {                
                this.alert("Error: Fetch failed.", "error")
            }
        )
    }

    loadImagestore(){
        PROPS.imagestore.forEach(name => IDB.get("image", name.split(".")[0]).then(result => {
            if(!result.hasContent){
                fetch(`${IMAGE_STORE_PATH}/${name}`)
                    .then(response => response.blob())
                    .then(blob => blobToDataURL(blob))                    
                    .then(dataUrl => {
                        this.clog(`storing fetched image ${name}`)
                        IDB.put("image", {
                            name: name.split(".")[0],
                            imgsrc: dataUrl
                        })
                        this.doLater("showImages", REBUILD_IMAGES_DELAY)
                    })
            }
        }))
    }

    clean(){
        localStorage.clear()
        indexedDB.deleteDatabase(DATABASE_NAME)
        this.alert("Cleared localStorage and indexedDB.", "success")
        setTimeout(() => document.location.reload(), ALERT_DELAY)
    }

    commandChanged(ev){
        if( (ev.type == "keyup") && (ev.keyCode == 13) ){
            let command = ev.target.value
            this.commandInput.setValue("")
            switch(command){
                case "clean":
                    this.clean()
                    break
            }
        }
    }

    lichess(){        
        window.open(lichessAnalysisUrl(this.fen, this.variant))
    }

    onBookWorkerMessage(message){
        let data = message.data

        if(data.action == "renderFilterBook"){
            this.renderFilterBook(data)
        }
    }

    onTreeDivResize(){                       
        setTimeout(() => {try{
            let tdcr = this.treeDiv.e.getBoundingClientRect()        
            let cncdcr = this.currentNodeCaptionDiv.e.getBoundingClientRect()                                                                
            this.tabs.bodyDiv.e.scrollLeft = cncdcr.x - tdcr.x - this.tabs.width / 2 + ( this.g.currentnodeid == "root" ? 270 : 0 )
            this.tabs.bodyDiv.e.scrollTop = cncdcr.y - tdcr.y
        }catch(err){}}, 0)     
    }

    renderAboutDiv(){
        let aboutDiv = div()

        try{
            aboutDiv.a(div(), div().marl(20).html(md2html(PROPS.readme)))
        }catch(err){}

        return aboutDiv
    }

    renderLogDiv(){
        this.logger = Logger({capacity: 200}).mar(5).bc("#ddd").pad(2)

        return div().a(this.logger)
    }

    createBoard(){
        return Board({
            id: "mainboard",            
            parentApp: this,
            squaresize: parseInt(getLocal("app/maintabpane/squaresizeCombo", {selected: DEFAULT_SQUARESIZE}).selected),
            positionchangedcallback: this.positionchanged.bind(this)
        })
    }

    renderAnalysisInfoDiv(){
        return div().w(260).ovfs()
    }

    renderGamesDiv(){
        return div().fs(16).ffm().a(
            div().ame(
                Button("Reload", this.fetchGames.bind(this)),
                Labeled("Merge Depth",
                    Combo({                    
                        id: "mergeDepthCombo",                    
                        display: "Merge Depth",                                        
                        options: Array(20).fill(null).map((_, i) => ({value: (i+1)*5, display: (i+1)*5})),
                        selected: 15,
                        settings: this.settings
                    })
                ),
                this.loadTimeDiv = div().fs(12).marl(20).dib()
            ),
            this.gamesListDiv = div()
        )
    }

    createTabPanes(){
        let username = PROPS.USER ? PROPS.USER.username : "_ Auth _"

        this.gamesTabPane = TabPane({id: "gamestabpane"}).setTabs([
            Tab({id: "games", caption: "Fresh games", content: this.gamesDiv}),
            Tab({id: "archivegames", caption: "Archive games", content: this.archiveDiv}),
            Tab({id: "filtergames", caption: "Filter games", content: this.filterDiv}),
            Tab({id: "filterbook", caption: "Filter book", content: this.filterBookDiv}),
            Tab({id: "chart", caption: "Chart", content: this.chartDiv}),
        ])

        this.gamesTabPane.headDiv.bc("#eee")

        this.botTabPane = TabPane({id: "bottabpane"}).setTabs([
            Tab({id: "botlog", caption: "Log", content: this.botDiv}),            
            Tab({id: "botsettings", caption: "Settings", content: this.botSettingsDiv}),            
        ])

        this.animsTabPane = TabPane({id: "animstabpane"}).setTabs([
            Tab({id: "anims", caption: "Animations", content: this.animsDiv}),            
            Tab({id: "images", caption: "Images", content: this.imageDiv}),
        ])

        this.toolsTabPane = TabPane({id: "toolstabpane"}).setTabs([
            Tab({id: "log", caption: "Log", content: this.logDiv}),
            Tab({id: "multiPGN", caption: "Multi PGN", content: this.multiPGNDiv}),
            Tab({id: "fen", caption: "FEN", content: this.fenDiv}),
            Tab({id: "study", caption: "Studies", content: this.studyDiv}),
            Tab({id: "tourney", caption: "Tourney", content: this.tourneyDiv}),
        ])

        this.tabs = TabPane({id: "maintabpane"}).setTabs([
            Tab({id: "moves", caption: "Moves", content: this.movesDiv}),            
            this.transpositionsTab = 
            Tab({id: "transpositions", caption: "Transp", content: this.transpositionsDiv}),            
            Tab({id: "games", caption: "Games", content: this.gamesTabPane}),
            Tab({id: "train", caption: "Train", content: this.trainDiv}),            
            Tab({id: "tree", caption: "Tree", content: this.treeDiv}),            
            Tab({id: "bot", caption: "Bot", content: this.botTabPane}),                        
            Tab({id: "anims", caption: "Anims", content: this.animsTabPane}),
            Tab({id: "backup", caption: "Backup", content: this.backupDiv}),            
            Tab({id: "settings", caption: "Settings", content: this.settingsDiv}),
            Tab({id: "users", caption: "Users", content: this.lichessUsersDiv}),
            Tab({id: "tools", caption: "Tools", content: this.toolsTabPane}),
            Tab({id: "about", caption: "About", content: this.aboutDiv}),
            Tab({id: "auth", caption: username, content: this.authDiv}),            
        ])

        this.containerPane = SplitPane({            
            row: true,            
            headsize: this.board.boardsize(),
            headSelectable: true,
        })

        this.containerPane.headDiv.jc("flex-start").a(div().dfcc().a(
            this.board,
            this.controlPanel = this.renderControlPanel(),
            this.gametext = TextAreaInput()
                .w(this.board.boardsize() - 12)
                .h(GAME_TEXT_AREA_HEIGHT + scrollBarSize())
        ))

        this.containerPane.setContent(this.tabs)

        this.mainPane.setContent(this.containerPane)

        this.mainPane.headDiv.ffm().jc("initial").bc("#eee").c("#00f")

        this.am(
            this.mainPane
        )
    }

    minimax(clear){
        this.tabs.selectTab("tools")
        this.toolsTabPane.selectTab("log")

        this.logger.log(LogItem({text: `${clear ? "Clearing" : "Minimaxing"} ${this.g.line()} .`}))

        let nodes = this.getcurrentnode().subnodes()

        this.logger.log(LogItem({text: `Tree size ${nodes.length} .`}))

        nodes.forEach(node => {
            node.hasEval = false
            node.eval = null
        })

        if(clear){
            this.logger.log(LogItem({text: `Minimax cleared .`, cls: "green"}))
            return
        }

        IDB.getKeys("engine", nodes.map(node => node.analysiskey)).then(analysis => {            
            this.logger.log(LogItem({text: `Analyzed nodes ${Object.keys(analysis).length} .`}))
            
            this.negamaxRecursive(this.getcurrentnode(), analysis)
            
            this.logger.log(LogItem({text: `Minimax done .`, cls: "green"}))            
        })
    }

    negamaxRecursive(node, analysis){
        let evl = null

        for(let child of node.sortedchilds()){
            let childEval = this.negamaxRecursive(child, analysis)            

            if(!(childEval === null)){
                if(evl === null) evl = -childEval
                else if(-childEval > evl) evl = -childEval
            }
        }

        if(evl === null){
            let a = analysis[node.analysiskey]

            if(a){
                let rai = new RichAnalysisInfo(a)

                if(rai.hasScorenumerical) evl = rai.scorenumerical
            }
        }

        if(!(evl === null)){
            node.hasEval = true
            node.eval = evl
        }

        return evl
    }

    clearMinimax(){
        this.minimax(true)
    }

    renderAlertDiv(){
        return div()
            .poa().t(50).l(50).show(false)            
    }

    renderImageDiv(){
        return div()
            .dfca().flww()
            .ac("unselectable")            
    }

    clearPassword(){
        localStorage.removeItem(PASSWORD_KEY)
    }

    renderAuthDiv(){
        let authDiv = div().a(
            div().dfc().mar(5).a(                
                Button("Login with lichess", this.loginWithLichess.bind(this)).fs(20).mar(5).pad(5).bc(GREEN_BUTTON_COLOR),
                Button("Login with lichess-bot", this.loginWithLichessBot.bind(this)).fs(20).mar(5).pad(5).bc(GREEN_BUTTON_COLOR),                
                Button("Set Password", this.setPassword.bind(this)).mar(5).marl(10).bc(BLUE_BUTTON_COLOR),
                Button("Clear Password", this.clearPassword.bind(this)).mar(5).bc(RED_BUTTON_COLOR),                
            )            
        )

        if(PROPS.USER){
            authDiv.a(
                table().marl(15).sa("cellpadding", 10).sa("border", 1).a(
                    Object.entries(PROPS.USER._json.perfs).map(perf => tr().a(
                        td().html(perf[0]).c("#00f"),
                        td().html(perf[1].games).c("#707").fwb(),
                        td().html(perf[1].rating).c("#070").fwb(),
                        td().html(perf[1].rd).c("#770").fwb()
                )))
            )
        }

        return authDiv
    }

    renderArchiveDiv(){
        return div().a(
            this.archiveInfoDiv = div().h(30).ffm().mar(2).pad(2).bc("#eee"),
            this.archiveGamesDiv = div().ffm().mar(2).pad(2).bc("#fdf")
        )
    }

    renderFilterBookDiv(){
        return div().a(
            this.filterBookInfoDiv = div().mar(5).ffm().bc("#eee").h(30),
            this.filterBookContentDiv = div().mar(5).ffm(),
            this.filterBookPagesDiv = div().mar(5).ffm()
        )
    }

    renderFilterDiv(){
        return div().a(
            this.filterEditableList = EditableList({
                id: "filtereditablelist",
                isContainer: true,
                forceRollOnSelect: true,
                showSelected: true,
                changeCallback: this.filterChanged.bind(this),
                forceCreateKind: "textarea"
            }).mar(5),
            this.filterResultsDiv = div().marl(5).ffm()
        )
    }

    renderBackupDiv(){
        return div().a(
            div()
                .mar(5)
                .a(
                    Button("Show", this.showBackup.bind(this)).bc(BLUE_BUTTON_COLOR),
                    Button("Backup Remote", this.backupRemote.bind(this)).bc(GREEN_BUTTON_COLOR),
                    Button("Restore Remote", this.restoreRemote.bind(this)).bc(RED_BUTTON_COLOR),
                    Button("Backup Local", this.backupLocal.bind(this)).bc(GREEN_BUTTON_COLOR),
                    Button("Backup Git", this.backupGit.bind(this)).bc(YELLOW_BUTTON_COLOR),
                    Button("Restore Git", this.restoreGit.bind(this)).bc(RED_BUTTON_COLOR),
                ),            
            this.backupTextArea = TextAreaInput().mar(10).w(this.board.boardsize()).h(this.board.boardsize())
                .ae("paste", this.backupPasted.bind(this)).dropLogic(this.backupDropped.bind(this))
        )
    }

    renderControlPanel(){
        return div()
            .dfc().flww().w(this.board.boardsize() - 6)
            .mar(3).marl(0).pad(3).bc("#cca")
            .a(
                Button("i", this.reset.bind(this)).ff("lichess").bc(RED_BUTTON_COLOR),
                Button("B", this.board.doflip.bind(this.board)).ff("lichess").bc(CYAN_BUTTON_COLOR),
                Button("W", this.board.tobegin.bind(this.board)).ff("lichess").bc(BLUE_BUTTON_COLOR),                
                Button("Y", this.board.back.bind(this.board)).ff("lichess").bc(GREEN_BUTTON_COLOR),
                Button("X", this.board.forward.bind(this.board)).ff("lichess").bc(GREEN_BUTTON_COLOR),
                Button("V", this.board.toend.bind(this.board)).ff("lichess").bc(BLUE_BUTTON_COLOR),
                Button("L", this.delMove.bind(this)).ff("lichess").bc(RED_BUTTON_COLOR),                                  
                this.gobutton = Button("Go", this.go.bind(this)).bc(GREEN_BUTTON_COLOR),
                this.stopbutton = Button("Stop", this.stop.bind(this)).bc(IDLE_BUTTON_COLOR),                
                this.lichessbutton = Button("L", this.lichess.bind(this)).bc(YELLOW_BUTTON_COLOR),                
                Button("R", this.reloadPage.bind(this)).bc(YELLOW_BUTTON_COLOR),                                                      
                this.commandInput = TextInput().w(60).ae("keyup", this.commandChanged.bind(this)),                                
                Button("G", this.loadLatestGame.bind(this)).bc(GREEN_BUTTON_COLOR),                                                      
            )
    }

    loadLatestGame(){
        this.fetchGames().then(_ => {
            if(this.games) if(this.games.length){
                this.gameClicked(this.games[0], MERGE_ALL_MOVES)
            }
        })
    }

    renderBotSettingsForm(){
        return div().a(FormTable({
            options: [
                TextAreaInput({
                    id: "acceptBotVariantsTextAreaInput",                    
                    display: "Accept variants",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "useBotBookCheckbox",                    
                    display: "Use bot book",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "useOwnBookCheckbox",                    
                    display: "Use own book",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "allowOpponentWeightsInBotBookCheckbox",                    
                    display: "Allow opponent weights in own book",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "allowFallBackToBotBook",                    
                    display: "Allow fall back to bot book",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "makeRandomBotMovesCheckbox",                    
                    display: "Make random bot moves",                                        
                    settings: this.settings
                }),
                Combo({                    
                    id: "moveOverHeadCombo",                    
                    display: "Move Overhead",                                        
                    options: Array(50).fill(null).map((_, i) => ({value: (i+1)*100, display: (i+1)*100})),
                    selected: DEFAULT_MOVE_OVERHEAD,
                    settings: this.settings
                }),                
                Combo({                    
                    id: "reduceThinkingTimeCombo",                    
                    display: "Reduce thinking time",                                        
                    options: Array(10).fill(null).map((_, i) => ({value: (i+1), display: (i+1)})),
                    selected: DEFAULT_REDUCE_THINKING_TIME,
                    settings: this.settings
                }),                
            ]   
        }))
    }

    renderSettingsForm(){
        return div().a(FormTable({
            options: [
                Combo({                    
                    id: "variantCombo",                    
                    display: "Variant",                                        
                    options: SUPPORTED_VARIANTS.map(entry => ({value: entry[0], display: entry[1]})),
                    selected: DEFAULT_VARIANT,
                    settings: this.settings
                }),                
                CheckBoxInput({
                    id: "useServerStockfishCheckbox",                    
                    display: "Use server Stockfish ( admin )",                                        
                    settings: this.settings
                }),
                Combo({                    
                    id: "multipvCombo",                    
                    display: "MultiPV",                                        
                    options: Array(20).fill(null).map((_, i) => ({value: i+1, display: i+1})),
                    selected: DEFAULT_MULTIPV,
                    settings: this.settings
                }),
                Combo({                    
                    id: "threadsCombo",                    
                    display: "Threads",                    
                    options: Array(4).fill(null).map((_, i) => ({value: (i+1), display: (i+1)})),
                    selected: DEFAULT_THREADS,
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "highlightanimationmovesCheckbox",                    
                    display: "Highlight animation moves",                                        
                    settings: this.settings
                }),
                Combo({                    
                    id: "boardBackgroundCombo",                    
                    display: "Board bakcground",                    
                    options: (PROPS.backgrounds || ["wood.jpg"]).map(name => ({value: name, display: name})),
                    selected: "wood.jpg",
                    settings: this.settings
                }),
                Combo({                    
                    id: "squaresizeCombo",                    
                    display: "Square size",                    
                    options: Array(21).fill(null).map((_, i) => ({value: 30 + i*2.5, display: 30 + i*2.5})),
                    selected: DEFAULT_SQUARESIZE,
                    settings: this.settings
                }),
                Combo({                    
                    id: "treeMaxDepthCombo",                    
                    display: "Tree max depth",                    
                    options: Array(20).fill(null).map((_, i) => ({value: i+1, display: i+1})),
                    selected: TREE_MAX_DEPTH,
                    settings: this.settings
                }),
                Combo({                    
                    id: "treeBackwardDepthCombo",                    
                    display: "Tree backward depth",                    
                    options: Array(20).fill(null).map((_, i) => ({value: i+1, display: i+1})),
                    selected: TREE_BACKWARD_DEPTH,
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "disableLichessBookCheckbox",                    
                    display: "Disable lichess book",                                        
                    settings: this.settings
                }),
                Combo({                    
                    id: "lichessBookMaxMoves",                    
                    display: "Lichess book max moves",                    
                    options: Array(20).fill(null).map((_, i) => ({value: i+1, display: i+1})),
                    selected: LICHESS_BOOK_MAX_MOVES,
                    settings: this.settings,
                    changeCallback: this.positionchanged.bind(this)
                }),                
                MultipleSelect({
                    id: `lichessBookAvgRatingMultipleSelect`,                    
                    display: `Lichess book average rating`,                    
                    options: LICHESS_BOOK_AVG_RATINGS.map(avgrating => ({value: avgrating, display: avgrating})),
                    selected: LICHESS_BOOK_AVG_RATINGS.map(avgrating => ({value: avgrating, display: avgrating})),
                    hideDeleteButton: true,
                    hideAddButton: true,
                    settings: this.settings,
                    changeCallback: this.positionchanged.bind(this)
                }),
                MultipleSelect({
                    id: `lichessBookTimeControlsMultipleSelect`,                    
                    display: `Lichess book time controls`,                    
                    options: LICHESS_BOOK_TIME_CONTROLS.map(timecontrol => ({value: timecontrol, display: timecontrol})),
                    selected: LICHESS_BOOK_TIME_CONTROLS.map(timecontrol => ({value: timecontrol, display: timecontrol})),
                    hideDeleteButton: true,
                    hideAddButton: true,
                    settings: this.settings,
                    changeCallback: this.positionchanged.bind(this)
                }),
                Combo({                    
                    id: "fetchMaxGamesCombo",                    
                    display: "Fetch max games",                    
                    options: Array(20).fill(null).map((_, i) => ({value: (i+1)*10, display: (i+1)*10})),
                    selected: DEFAULT_MAX_GAMES,
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "showAnalysisInBoardCheckbox",                    
                    display: "Show analysis in board",                                        
                    settings: this.settings
                }),
            ]
        }))
    }

    reset(){
        let variant = this.settings.variantCombo.selected
        if(!confirm(`Are you sure you want to delete all moves and create a new study with variant ${displayNameForVariant(variant)}?`, "reset")) return
        this.board.reset(variant)
    }

    reportFilterBook(info){
        this.filterBookInfoDiv.x().html(`Total ${this.filteredgames.length}, built ${this.filteredgames.length - this.filteredwithoutposition.length}. ${info ? info : ""}`)
    }

    buildFilterBook(){
        this.filteredwithoutposition = this.filteredgames.filter(lg => !lg.positions)
        this.reportFilterBook()
        if(this.filteredwithoutposition.length == 0){
            this.filterBookInfoDiv.x().html(`Filter book up to date.`)
            this.showFilterBook()
            this.showChart()
            return
        }        
        let lg = this.filteredwithoutposition[0]
        let b = ChessBoard().setfromfen(null, this.settings.variantCombo.selected)
        lg.positions = [b.fen]
        for(let san of lg.moves){
            let move = b.santomove(san)
            if(move){                
                b.push(move)
                lg.positions.push(b.fen)
            }else{
                break
            }
        }
        lg.orig.positions = lg.positions
        IDB.put("lichessgame", lg.orig).then(result => {
            if(result.ok){
                this.reportFilterBook(`Added ${lg.summary} .`)
                setTimeout(() => this.buildFilterBook(), 50)
            }
        })
    }

    currentFilter(){
        let fs = this.filterEditableList.selState()
        if(!fs) return null

        return fs.text
    }

    filterChanged(){
        this.filter = this.currentFilter()

        this.filteredgames = this.lichessgames.filter(lg => {
            return eval(this.filter)
        })

        this.filtergamesPages.list = this.filteredgames

        this.filterResultsDiv.a(this.filtergamesPages.render(0))

        this.buildFilterBook()

        this.showFilterBook()
    }

    renderArchiveItem(lg, i){
        return div().mar(1).bc(i++ % 2 ? "#ded" : "#dfd").cp()
            .html(i.toString().padEnd(6, "_") + new Date(lg.createdAt).toLocaleString().padEnd(24, "_") + lg.summarypadded)
            .ae("mousedown", this.gameClicked.bind(this, lg, MERGE_ALL_MOVES))
    }

    renderLichessGames(page){        
        this.lichessgamesPages.list = this.lichessgames
        this.archiveGamesDiv.x().a(this.lichessgamesPages.render(page))
    }

    loadGamesChunk(){                
        if(this.doFreshGames == "done"){
            this.archiveInfoDiv.html("Archive up to date.")
            return
        }

        this.lichessgames.sort((a,b) => a.createdAt - b.createdAt)

        let since = this.lichessgames.length ?
            this.doFreshGames ?
                this.lichessgames[this.lichessgames.length - 1].createdAt
            :
                0
        :
            0

        let until = this.lichessgames.length ?
            this.doFreshGames ?
                new Date().getTime()
            :
                this.lichessgames[0].createdAt
        :
            new Date().getTime()

        let max = this.doFreshGames ? 1000000 : LOAD_GAMES_CHUNK()

        this.renderLichessGames(this.lichessgamesPages.lastRenderedPage)

        this.archiveInfoDiv.html(`
            Archive has ${this.lichessgames.length} game(s).            
            Loading next ${this.doFreshGames ? "head" : "tail"} chunk of max ${max} since ${new Date(since).toLocaleString()} until ${new Date(until).toLocaleString()}.
        `)

        let url = lichessGamesUrl(this.username(), {
            max: max,
            since: since,
            until: until
        })

        if(this.doFreshGames) this.doFreshGames = "done"

        getLichessGames(
            this.username(),
            {
                max: max,
                since: since,
                until: until
            },
            this.USER().accessToken
        ).then(result => {
            let added = 0            

            let finalizefunc = () => {
                this.renderLichessGames(this.lichessgamesPages.lastRenderedPage)
                setTimeout(() => this.loadGamesChunk(), LOAD_GAMES_DELAY())
            }

            if(result.ok){                        
                let total = result.content.length
                if(result.content.length){
                    result.content.forEach(game => IDB.put("lichessgame", game).then(result => {                                            
                        if(result.ok){
                            if(!this.lichessgames.find(g => g.id == game.id)){
                                this.lichessgames.push(LichessGame(game, this.lichessusername))
                                added++                        
                            }
                        }
                        total--
                        this.archiveInfoDiv.html(`Games loaded ok. Added ${added}. Total ${this.lichessgames.length}.`)
                        if(total == 0){
                            if((added == 0) && (!this.doFreshGames)) this.doFreshGames = true                            
                            finalizefunc()
                        }
                    }))
                }else{
                    if(!this.doFreshGames) this.doFreshGames = true
                    finalizefunc()
                }                
            }else{
                this.archiveInfoDiv.html(`Load failed. Total ${this.lichessgames.length}.`)                                
                finalizefunc()
            }
        })        
    }

    loadGames(){
        this.lichessgames = []
        this.lichessgamesPages = RenderPages({
            list: this.lichessgames,
            chunkSize: ARCHIVE_RENDER_CHUNK(),
            renderItem: this.renderArchiveItem.bind(this),
            sortItems: (a,b) => b.createdAt - a.createdAt
        })
        this.filteredgames = []
        this.filtergamesPages = RenderPages({
            list: this.filteredgames,
            chunkSize: ARCHIVE_RENDER_CHUNK(),
            renderItem: this.renderArchiveItem.bind(this),
            sortItems: (a,b) => b.createdAt - a.createdAt
        })
        this.bookgames = []
        this.bookgamesPages = RenderPages({
            list: this.bookgames,
            chunkSize: ARCHIVE_RENDER_CHUNK(),
            renderItem: this.renderArchiveItem.bind(this),
            sortItems: (a,b) => b.createdAt - a.createdAt
        }).mart(10)
        this.lichessusername = this.username()
        this.archiveInfoDiv.html(`Loading archive games ...`)
        IDB.getAll("lichessgame").then(result =>{
            if(result.hasContent){
                this.lichessgames = result.content
                    .map(game => LichessGame(game, this.lichessusername))
                    .filter(lg => lg.hasMe)
            }            
            this.archiveInfoDiv.html(`Archive has ${this.lichessgames.length} game(s). Refreshing soon.`)
            this.renderLichessGames(this.lichessgamesPages.lastRenderedPage)
            setTimeout(() => this.loadGamesChunk(), LOAD_GAMES_INITIAL_DELAY)
        })        
    }

    initgif(){
        this.gif = new GIF({
            workers: 2,
            quality: 10
        })
    
        this.gif.on('finished', function(blob) {
            window.open(URL.createObjectURL(blob))
        })
    }
}

logRemote("easychess_index")

initDb().then(
    _ => {
        let app = new App({id: "app"})

        document.getElementById('root').appendChild(app.e)

        app.clog(app)
        app.clog(PROPS)
    },
    err => {
        console.log(err.content)
    }
)

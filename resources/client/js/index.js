////////////////////////////////////////////////////////////////////////////////
// config

const urlParams                 = new URLSearchParams(window.location.search)

const SKIP_CONFIRM                  = true
const CREATE_SETUP_BOARD_DELAY      = 3000
const IMPORT_GAME_DELAY             = 1000
const DEFAULT_VIDEO_ANIMATION_DELAY         = 1
const DEFAULT_VIDEO_ANIMATION_GRANULARITY   = 3
const MAKE_THREE_DELAY              = 1000

const MOVESDIV_HEIGHT_CORRECTION    = 36
const PGN_TEXT_AREA_HEIGHT          = 120

const DISCORD_LOGIN_URL         = "auth/discord"
const GITHUB_LOGIN_URL          = "auth/github"

const DO_ALERT                  = true

const STOCKFISH_JS_PATH         = "resources/client/cdn/stockfish.wasm.js"
const GAME_EXPORT_PATH          = "https://raw.githubusercontent.com/easychessanimations/easychessgames/master/gamexport"
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

const QUERY_INTERVAL            = PROPS.QUERY_INTERVAL || 30000

const TICK_INTERVAL             = PROPS.TICK_INTERVAL || 10000

const GAME_TEXT_AREA_HEIGHT     = 95
const GAME_TEXT_AREA_WIDTH      = 882
const COMMENT_TEXT_AREA_WIDTH   = 240

const THUMB_SIZE                = 150

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
const MERGE_SILENT                  = true

const SHOULD_GO_DELAY               = 5000
const BOT_STARTUP_DELAY             = 7500

const DELETE_MOVE_WARN_LIMIT        = 50

const DEFAULT_REDUCE_THINKING_TIME  = 1
const DEFAULT_THREE_ANIMATION_DELAY = 250
const ALL_THREE_PIECES              = ["Queen", "Rook"]

const IMPORT_TIMEOUT                = 3 * ALERT_DELAY

////////////////////////////////////////////////////////////////////////////////

function oppMessage(msg, oppName){
    return oppName ? `${msg}, ${oppName} !` : `${msg} !`
}

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

        globalAlertFunc = this.alert.bind(this)

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

        this.threeBoard = {}
        this.threeBoardDiv = div()

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

        this.videoDiv = this.renderVideoDiv()

        this.randomDiv = this.renderRandomDiv()

        this.animSettingsDiv = this.renderAnimSettingsDiv()

        this.backupDiv = this.renderBackupDiv()

        this.botSettingsDiv = this.renderBotSettingsForm()

        this.faqDiv = div()

        this.aboutDiv = this.renderAboutDiv()

        this.logDiv = this.renderLogDiv()

        this.multiPGNDiv = this.renderMultiPGNDiv()

        this.fenDiv = this.renderFenDiv()

        this.setupDiv = div()

        this.studyDiv = this.renderStudyDiv()

        this.smartdomDiv = this.renderSmartdomDiv()

        this.threeAnimationDiv = div()

        this.tourneyDiv = this.renderTourneyDiv()

        this.gamesDiv = this.renderGamesDiv()

        this.gamesDiv.resize = this.buildGames.bind(this)

        this.archiveDiv = this.renderArchiveDiv()

        this.filterDiv = this.renderFilterDiv()

        this.filterBookDiv = this.renderFilterBookDiv()

        this.chartDiv = div()

        this.playDiv = div()

        this.gameSearchDiv = this.renderGameSearchDiv()

        this.feedbackDiv = this.renderFeedbackDiv()

        this.generalSettingsDiv = this.renderGeneralSettingsDiv()

        this.engineSettingsDiv = this.renderEngineSettingsDiv()

        this.lichessSettingsDiv = this.renderLichessSettingsDiv()

        this.createTabPanes()

        this.alertDiv = this.renderAlertDiv()

        this.mainPane.a(this.alertDiv)

        this.loadStudy("Default")

        this.trainChanged()

        this.showImages()

        this.loadImagestore()

        this.fetchGames()

        this.doLater("loadGamesConditional", 100)

        this.doLater("loadLichessUsers", LOAD_LICHESS_USERS_DELAY)

        if(window.location.search.match(/login-lichess-bot=ok|login-lichess=ok/)) this.ubertabs.selectTab("analyze")
        if(window.location.search.match(/login-lichess-bot=ok/)) this.tabs.selectTab("bot")
        if(window.location.search.match(/login-lichess=ok/)) this.tabs.selectTab("moves")

        if(this.USER().isBot){
            this.botInfoDiv.html("Upgrading lichess-bot .")

            this.doLater("botStartUp", BOT_STARTUP_DELAY)
        }

        this.buildStudies()

        this.setInfoBar("Welcome to easychess.")

        setTimeout(this.smartdomChanged.bind(this, !DO_ALERT), 1000)

        setTimeout(this.selectQueryTab.bind(this), 500)

        this.doLater("makeThreeAnimationDiv", MAKE_THREE_DELAY * 2)
        this.doLater("makeThreeBoardDiv", MAKE_THREE_DELAY)

        this.makePlayDiv()

        this.setupsource()        

        if(IS_PROD()) this.checkSourceInterval = setInterval(this.checksource.bind(this), TICK_INTERVAL)

        this.lastApiTick = performance.now()

        if(IS_PROD()) this.apiPingInterval = setInterval(this.apiPing.bind(this), 5 * QUERY_INTERVAL)
        if(IS_PROD()) this.checkApiInterval = setInterval(this.checkApi.bind(this), 5 * QUERY_INTERVAL)

        this.doLater("importGame", IMPORT_GAME_DELAY)
        this.doLater("createSetupBoard", CREATE_SETUP_BOARD_DELAY)

        this.doLater("loadFaq", 1000)
    }

    loadFaq(){
        let faqDiv = this.faqDiv        
        fetch("https://raw.githubusercontent.com/easychessanimations/faq/master/easychess_faq.html").then(resp=>resp.text()).then(content=>{            
            faqDiv.x().a(
                div(),
                div().pad(10).html(content)
            )
        })
    }

    renderGeneralSettingsDiv(){
        return div().a(FormTable({
            options: [
                Combo({                    
                    id: "variantCombo",                    
                    display: "Variant",                                        
                    options: SUPPORTED_VARIANTS.map(entry => ({value: entry[0], display: entry[1]})),
                    selected: DEFAULT_VARIANT,
                    settings: this.settings
                }).fs(24).bc(GREEN_BUTTON_COLOR),
                CheckBoxInput({
                    id: "disablePieceSoundsCheckbox",                    
                    display: "Disable piece sounds",
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "disable3dBoardCheckbox",                    
                    display: "Disable 3d board",
                    settings: this.settings
                }),
                Combo({                    
                    id: "boardBackgroundCombo",                    
                    display: "Board bakcground",                    
                    options: (PROPS.backgrounds || [DEFAULT_BOARD_BACKGROUND]).map(name => ({value: name, display: name})),
                    selected: DEFAULT_BOARD_BACKGROUND,
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
                })
            ]
        }))
    }

    renderEngineSettingsDiv(){
        return div().a(FormTable({
            options: [                
                CheckBoxInput({
                    id: "useServerStockfishCheckbox",                    
                    display: `Use server Stockfish${PROPS.ALLOW_SERVER_ENGINE ? "":" ( admin )"}`,                                        
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
                    id: "showAnalysisInBoardCheckbox",                    
                    display: "Show analysis in board",                                        
                    settings: this.settings
                }),                
            ]
        }))
    }

    renderLichessSettingsDiv(){
        return div().a(FormTable({
            options: [                
                CheckBoxInput({
                    id: "allowLichessBookCheckbox",                    
                    display: "Allow lichess book",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "allowFreshGamesCheckbox",                    
                    display: "Allow fresh games",                                        
                    settings: this.settings
                }),                
                Combo({                    
                    id: "fetchMaxFreshGamesCombo",                    
                    display: "Fetch max fresh games",                    
                    options: Array(20).fill(null).map((_, i) => ({value: (i+1)*10, display: (i+1)*10})),
                    selected: DEFAULT_MAX_GAMES,
                    settings: this.settings
                }),                
                CheckBoxInput({
                    id: "allowGameArchiveCheckbox",                    
                    display: "Allow game archive",                                        
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
                })
            ]
        }))
    }

    renderAnimSettingsDiv(){
        return div().a(FormTable({
            options: [
                Combo({                    
                    id: "videoAnimationDelayCombo",                    
                    display: "Video animation delay sec(s)",                    
                    options: Array(20).fill(null).map((_, i) => ({value: (i+1), display: (i+1)})),
                    selected: DEFAULT_VIDEO_ANIMATION_DELAY,
                    settings: this.settings
                }),
                Combo({                    
                    id: "videoAnimationGranularityCombo",                    
                    display: "Video animation granularity phases / move",                    
                    options: Array(20).fill(null).map((_, i) => ({value: (i+1), display: (i+1)})),
                    selected: DEFAULT_VIDEO_ANIMATION_GRANULARITY,
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "animate3dCheckbox",                    
                    display: "Animate 3d",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "highlightanimationmovesCheckbox",                    
                    display: "Highlight animation moves",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "allowThreeAnimationCheckbox",                    
                    display: "Allow three animation",                                        
                    settings: this.settings
                }),
            ]
        }))
    }

    switchToAnalyzeMoves(){
        this.ubertabs.selectTab("analyze")
        this.tabs.selectTab("moves")
    }

    importGame(){
        let importID = urlParams.get("import")

        if(importID){
            this.alert(`Importing game [ ${importID} ] .`, "info", IMPORT_TIMEOUT)

            let url = `${GAME_EXPORT_PATH}/${importID}.txt`

            fetch(url).then(
                response => response.text().then(
                    content => {
                        try{
                            let blob = JSON.parse(content)
                            let game = Game().fromblob(blob)
                            setTimeout(_ => {
                                this.board.setgame(game)                            
                                this.switchToAnalyzeMoves()
                                this.alert(`Game [ ${importID} ] imported ok .`, "success")
                            }, IMPORT_TIMEOUT)                            
                        }catch(err){
                            this.alert(`Fetch parse error . Importing ${importID} failed .`, "error")
                        }
                    },
                    err => {
                        this.alert(`Fetch response text error . Importing ${importID} failed .`, "error")
                    }
                ),
                err => {
                    this.alert(`Fetch error . Importing ${importID} failed .`, "error")
                }
            )
        }

        let importPosition = urlParams.get("position")

        if(importPosition){
            let m = importPosition.match(/^([^\/]+)\/(.+)/)

            if(m){
                let variant = m[1]
                let fen = m[2]
                this.alert(`Importing ${variant} position .<br><br>FEN<br><br>${fen}`, "info", IMPORT_TIMEOUT)

                setTimeout(_ => {
                    this.g.variant = variant
                    this.resetFromFen(fen, SKIP_CONFIRM)
                    this.switchToAnalyzeMoves()
                    this.alert(`Position imported ok .`, "success")
                }, IMPORT_TIMEOUT)                
            }
        }
    }

    renderFeedbackDiv(){
        return div().a(
            div().dfcc().mar(5).a(
                div().addStyle("width", "90%").mart(20).pad(20).bdr("solid", 10, "#aaa", 20).tac().bc("#ff0").a(
                    a().fs(30).fwb().href("https://discord.gg/RKJDzJj", TARGET_BLANK)
                        .html("Join easychess on Discord")
                ),
                div().addStyle("width", "50%").mart(40).pad(10).bdr("solid", 5, "#aaa", 10).tac().bc("#ff0").a(
                    a().fs(20).fwb().href("https://github.com/easychessanimations/easychess/issues", TARGET_BLANK)
                        .html("Open an issue on GitHub")
                )
            )
        )
    }

    renderGameSearchDiv(){
        return div().a(
            div().dfcc().mar(5).a(
                div().addStyle("width", "98%").pad(10).tac().fs(22).bc("#abc").html(`
Yet an other chess interface with cool features:<br><br>
<a href="https://pgneditor.herokuapp.com" rel="noopener noreferrer" target="_blank">pgneditor.herokuapp.com</a>
`),
                div().addStyle("width", "98%").mart(10).pad(10).tac().fs(22).bc("#afa").html(`
Convenience wrapper around the lichess game download API ( <a href="https://lichess.org/api#operation/apiGamesUser" rel="noopener noreferrer" target="_blank">lichess.org/api#operation/apiGamesUser</a> ) that lets you download a user's games filtered by various criteria:<br><br>
<a href="https://lichessgamedownload.netlify.app" rel="noopener noreferrer" target="_blank">lichessgamedownload.netlify.app</a>
`),
                div().addStyle("width", "98%").mart(10).pad(10).tac().fs(22).bc("#aff").html(`
Streaming advanced games search using the lichess game download API ( <a href="https://lichess.org/api#operation/apiGamesUser" rel="noopener noreferrer" target="_blank">lichess.org/api#operation/apiGamesUser</a> ) that lets you search and download a user's games filtered by advanced criteria, or by custom Javascript function ( more powerful than lichess search ):<br><br>
<a href="https://fbserv.herokuapp.com/games.html" rel="noopener noreferrer" target="_blank">fbserv.herokuapp.com/games.html</a>
`),
                div().addStyle("width", "98%").mart(10).pad(10).tac().fs(22).bc("#ffa").html(`
Recognize the position on a chess board screenshot and open it in lichess game explorer:<br><br>
<a href="https://img2lichess.herokuapp.com" rel="noopener noreferrer" target="_blank">img2lichess.herokuapp.com</a>
`),
                div().addStyle("width", "98%").mart(10).pad(10).tac().fs(22).bc("#faf").html(`
Filter lichess tourneys by various criteria and present them in a clear tabulated form:<br><br>
<a href="https://fbserv.herokuapp.com/tourneys.html" rel="noopener noreferrer" target="_blank">fbserv.herokuapp.com/tourneys.html</a>
`),
                div().addStyle("width", "98%").mart(10).pad(10).tac().fs(22).bc("#aaf").html(`
Insert unicode smileys, use unicode bold, underline etc. formatting for forums which allow only plain text:<br><br>
<a href="https://fbserv.herokuapp.com/smileyeditor.html" rel="noopener noreferrer" target="_blank">fbserv.herokuapp.com/smileyeditor.html</a>
`)
            )
        )
    }

    makePlayDiv(){
        this.playDiv.x().am(this.renderPlayDiv())
    }

    renderPlayDiv(){
        return div().a(
            this.table = Table({
                id: "maintable",
                parentApp: this
            })
        )
    }

    makeThreeBoardDiv(){
        if(this.settings.disable3dBoardCheckbox.checked){
            this.threeBoardDiv.x().a(this.renderMissingContent("disabled"))
        }else{
            this.threeBoardDiv.x().am(this.renderThreeBoardDiv())
        }        
    }

    renderMissingContent(info){
        return div().a(
            div(),
            div()
                .mar(5).pad(5).bc("#faa").fs(20).fwb()
                .html(`Content missing. Reason : ${info} .`)
        )
    }

    makeThreeAnimationDiv(){
        if(!this.settings.allowThreeAnimationCheckbox.checked){
            this.threeAnimationDiv.x().a(this.renderMissingContent("disabled"))
            return
        }

        this.threeAnimationDiv.x().am(this.renderThreeAnimationDiv())

        this.initThreeRenderer()
    }

    renderThreeBoardDiv(){        
        return div().a(
            div().mar(5).a(
                this.threeBoard = ThreeBoard({
                    id: "mainthreeboard",
                    drawOkCallback: this.threeBoardDrawOkCallback.bind(this),
                    moveCallback: this.board.makeMove.bind(this.board)
                })
            )
        )
    }

    threeBoardDrawOkCallback(){
        this.boardExportPreviewCanvasHook.x()
    }

    selectQueryTab(){
        let ubertab = urlParams.get("ubertab")
        if(ubertab){
            this.ubertabs.selectTab(ubertab)
        }
        let tab = urlParams.get("tab")
        if(tab){
            let parts = tab.split("/")        
            let tp = this.tabs
            while(parts.length){
                let t = parts.shift()                
                tp.selectTab(t)
                tp = tp.selected.content
            }
        }
    }

    loadGamesConditional(){
        if(!IS_LICHESS_PROVIDER()) return
        if(!this.settings.allowGameArchiveCheckbox.checked) return
        this.loadGames()
    }

    reportMultiPGN(docomments){
        this.multiPGNTextAreaInput.setValue(this.g.pgn(docomments, this.getcurrentnode(), DO_MULTI, this.settings.keepBaseLineCheckboxInput.checked, this.settings.reportAsUCICheckboxInput.checked)).copy()
    }

    reportMultiPGNWithAnalysis(){
        IDB.getKeys("engine", this.getcurrentnode().subnodes().map(node => node.analysiskey)).then(analysis => {            
            this.multiPGNTextAreaInput.setValue(this.g.pgn(analysis, this.getcurrentnode(), DO_MULTI, this.settings.keepBaseLineCheckboxInput.checked, this.settings.reportAsUCICheckboxInput.checked)).copy()
        })
    }

    pgnHeadersChanged(){
        this.g.setHeaders(this.pgnHeadersEditableList.subState().map(entry => [entry[0], entry[1].text]))
        this.doLater("storeDefault", 2 * STORE_DEFAULT_DELAY)
    }

    exportGame(){
        let content = JSON.stringify(this.g.serialize(), null, 2)

        api("git:exportgame", {
            content: content            
        }, response => {
            if(response.ok){
                let ID = response.ID
                let delay = 5 * ALERT_DELAY
                this.alert(`Game export done .<br><br> Exported game ID : ${ID} .<br><br>You will be redireted to the import url of the game .<br><br>Bookmark this page or copy its path from the address bar of your browser to share .`, "success", delay)                
                setTimeout(_ => {
                    document.location.href = `/?import=${ID}`
                }, delay)
            }else{
                this.alert(`Game export failed. ${response.error}`, "error")
            }
        })
    }

    renderMultiPGNDiv(){
        return div().a(
            div().mar(5).a(                
                div().mart(10).addStyle("width", "100%").pad(2).bc("#eee").a(
                    Button("Report PGN", this.reportMultiPGN.bind(this, !DO_COMMENTS)).bc(GREEN_BUTTON_COLOR),
                    Button("Report PGN with comments", this.reportMultiPGN.bind(this, DO_COMMENTS)).bc(GREEN_BUTTON_COLOR),
                    Button("Report PGN with analysis", this.reportMultiPGNWithAnalysis.bind(this)).bc(YELLOW_BUTTON_COLOR),
                    Labeled("Keep base",
                        this.keepBaseLineCheckboxInput = CheckBoxInput({
                            id: "keepBaseLineCheckboxInput",
                            settings: this.settings
                        })
                    ),
                    Labeled("Report as UCI",
                        this.reportAsUCICheckboxInput = CheckBoxInput({
                            id: "reportAsUCICheckboxInput",
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
                    .addStyle("width", "calc(100% - 10px)").h(380)
                    .ae("paste", this.multiPGNPasted.bind(this))
                    .toolTip({msg: "Paste PGN here .", align: "center"})
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

    smartdomChanged(doAlert){
        let content = this.smartdomTextAreaInput.value()
        try{
            let se = eval(content)
            this.smartdomHook.x().a(se)
            if(doAlert) this.alert("Smartdom render ok .", "success")
        }catch(err){
            if(doAlert) this.alert("Smartdom render error .", "error")
        }
    }

    renderSmartdomDiv(){
        return div().a(
            div().bc("#eee").mar(5).pad(5).a(
                this.smartdomTextAreaInput = TextAreaInput({id: "smartdomTextAreaInput"})
                    .toolTip({msg: "Enter smartdom tree here . <br>During typing you get a message on whether your tree is correct .", align: "center"})
                    .w(600).h(200)
                    .ae("input", this.smartdomChanged.bind(this, DO_ALERT)),
                this.smartdomHook = div().mart(5).pad(2).bc("#afa")
            )
        )
    }

    animateThree(){
        this.animI = 0

        this.threeAnimationDelay = parseInt(this.settings.threeAnimationDelayCombo.selected)
        
        this.threeGif = new GIF({
            workers: 2,
            quality: 10
        })
    
        this.threeGif.on('finished', function(blob) {
            window.open(URL.createObjectURL(blob))
        })

        this.steps = 20

        this.animate = function () {                        
            this.renderThreeAnimFrame()         
            this.animI++   
            if(this.animI <= this.steps) setTimeout(this.animate.bind(this), this.threeAnimationDelay)
        }
        this.animate()
    }

    renderThreeAnimFrame(){
        this.threeQueen.position.set(
            (0.5 - 2*this.animI/this.steps)* this.BOARD_GRID_WIDTH,
            (0.5 - 2*this.animI/this.steps) * this.BOARD_GRID_HEIGHT,
            0
        )

        this.threeRenderer.scene.rotation.x = this.animI * Math.PI / this.steps
        this.threeRenderer.scene.rotation.y = this.animI * Math.PI / this.steps        

        this.threeRenderer.render()

        this.animInfoDiv.html(`Frame # ${this.animI}`)

        let canvas = Canvas({width: this.THREE_WIDTH, height: this.THREE_HEIGHT})

        canvas.ctx.drawImage(this.threeRenderer.renderer.domElement, 0, 0)

        this.threeGif.addFrame(canvas.e, {delay: this.threeAnimationDelay})
    }

    renderThree(){
        if(this.threeGif) this.threeGif.render()
        else this.alert("No gif to render.")
    }

    initThreePieces(){
        let PIECE_SCALE = ( this.THREE_HEIGHT + this.THREE_WIDTH ) / 70000

        if(this.threeQueen){
            this.threeQueen.material = new THREE.MeshLambertMaterial({color: 0xffffff})                                
            this.threeQueen.scale.set(PIECE_SCALE, PIECE_SCALE, PIECE_SCALE)
            this.threeRenderer.scene.add(this.threeQueen)

            this.threeQueenOther = this.threeQueen.clone()
            this.threeQueenOther.material = new THREE.MeshLambertMaterial({color: 0x77ff77})                                
            this.threeQueenOther.scale.set(PIECE_SCALE, PIECE_SCALE, PIECE_SCALE)
            this.threeQueenOther.position.set(2.5 * this.BOARD_GRID_WIDTH, 3.5 * this.BOARD_GRID_HEIGHT, 0)
            this.threeRenderer.scene.add(this.threeQueenOther)
        }

        if(this.threeRook){
            this.threeRook.material = new THREE.MeshLambertMaterial({color: 0x777777})                    
            this.threeRook.position.set(1.5 * this.BOARD_GRID_WIDTH, 2.5 * this.BOARD_GRID_HEIGHT, 0)
            this.threeRook.scale.set(PIECE_SCALE, PIECE_SCALE, PIECE_SCALE)
            this.threeRenderer.scene.add(this.threeRook)
        }
    }

    initThreeRenderer(){        
        this.THREE_WIDTH = 400
        this.THREE_HEIGHT = 400

        this.threeRenderer = ThreeRenderer({RENDERER_WIDTH: this.THREE_WIDTH, RENDERER_HEIGHT: this.THREE_HEIGHT})

        this.threeRenderer.camera.position.z = 2

        this.BOARD_GRID_WIDTH = this.THREE_WIDTH / 2000
        this.BOARD_GRID_HEIGHT = this.THREE_HEIGHT / 2000
        
        this.objLoader = new THREE.OBJLoader()

        let loadedPieces = 0

        for(let threePieceKind of ALL_THREE_PIECES)
        this.objLoader.load("/resources/client/model/piece/" + threePieceKind + ".obj", object => {
            object.traverse( child => {        
                if (child instanceof THREE.Mesh) {                                        
                    child.rotation.z = -.1
                    child.rotation.x = 1.6
                    child.rotation.y = 1.7
                    this["three" + threePieceKind ] = child
                    loadedPieces++
                    if(loadedPieces == ALL_THREE_PIECES.length){
                        this.initThreePieces()

                        this.threeControlDiv.disp("initial")
                        this.animInfoDiv.html("Resources loaded ok .")                        

                        this.threeRendererHook.x().a(this.threeRenderer)                        

                        this.threeRenderer.render()
                    }
                }
            })
        })

        let boardTexture = new THREE.ImageUtils.loadTexture("resources/client/texture/board/board-pattern.png")
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
            this.THREE_WIDTH / 250,
            this.THREE_HEIGHT / 250,
            ( this.THREE_HEIGHT + this.THREE_WIDTH ) / 8000
        )

        let threeBoard = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(boardMaterials))

        this.threeRenderer.scene.add(threeBoard)

        this.threeRenderer.render()
    }

    renderThreeAnimationDiv(){
        return div().a(
            this.threeControlDiv = div().disp("none").a(
                Button("Animate", this.animateThree.bind(this)),
                Button("Render", this.renderThree.bind(this)),
                Labeled("Delay" , this.threeAnimationDelayCombo = Combo({                    
                    id: "threeAnimationDelayCombo",                    
                    display: "Perf",                                        
                    options: Array(41).fill(0).map((_, i) => ({value: i*50, display: i*50})),
                    selected: DEFAULT_THREE_ANIMATION_DELAY,
                    settings: this.settings
            }))),
            div().a(
                this.animInfoDiv = div().marl(5).ffm().dib().html("Loading resources, please wait ...")
            ),
            this.threeRendererHook = div().mar(5)
        )
    }

    exportPosition(){
        if(!confirm(`Export position and reduce game to the current position ?`, "reduce")) return
        
        let delay = 3 * ALERT_DELAY
        this.alert(`You will be redireted to the import url of the position .<br><br>Bookmark this page or copy its path from the address bar of your browser to share .`, "success", delay)                
        setTimeout(_ => {
            document.location.href = `/?position=${this.g.variant}/${this.g.fen()}`
        }, delay)
    }

    renderFenDiv(){
        return div().a(
            div().mar(5).a(
                div().df().jc("space-between").addStyle("width", "100%").pad(2).bc("#eee").a(
                    Button("Report FEN", this.reportFen.bind(this)).bc(GREEN_BUTTON_COLOR),                    
                    Button("Export game", this.exportGame.bind(this)).fs(18).bc(GREEN_BUTTON_COLOR),
                    Button("Export position", this.exportPosition.bind(this)).fs(18).bc(YELLOW_BUTTON_COLOR)
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
            Button("Reduce", this.reduce.bind(this)).mar(5).bc(RED_BUTTON_COLOR),
            div().mar(10).a(
                Button("Export preview", this.createBoardExportPreview.bind(this)).fs(18).bc(GREEN_BUTTON_COLOR),
                this.exportLink = a().marl(10).href("#").html("Export")
                    .download("board.png")
                    .ae("click", this.exportBoard.bind(this))
                    .fs(20)
                    .toolTip({msg: "Export board screenshot"})
            ),
            div().mar(5).a(
                this.boardExportPreviewCanvasHook = div()
            ),
            FormTable({
                options: EXPORTED_CANVAS_NAMES.map(name => CheckBoxInput({
                    id: name + "CanvasExportCheckboxInput",                    
                    display: "Skip " + name + " canvas export",
                    settings: this.settings
                }))
            })
                .marl(10)
        )
    }

    createBoardExportPreview(){        
        this.boardExportPreviewCanvasHook.x()        
        if(this.settings.animate3dCheckbox.checked){
            this.threeBoard.draw()
            this.boardExportPreviewCanvas = Canvas({width: this.threeBoard.THREE_WIDTH, height: this.threeBoard.THREE_HEIGHT})
            this.boardExportPreviewCanvas.ctx.drawImage(this.threeBoard.threeRenderer.renderer.domElement, 0, 0)
        }else{
            this.boardExportPreviewCanvas = this.exportedBoardCanvas()        
        }
        this.boardExportPreviewCanvasHook.a(this.boardExportPreviewCanvas)
    }

    exportBoard(){
        this.createBoardExportPreview()
        this.exportLink.href(this.boardExportPreviewCanvas.downloadHref("board", "png"))
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

    resetFromFen(content, skipConfirm){
        if(!skipConfirm) if(!confirm(`Are you sure you want to reset study from FEN ${content}. All moves will be lost.`, "reset")) return

        this.g.setfromfen(content)

        this.board.setgame(this.g)
    }

    fenResetPasted(ev){
        ev.preventDefault()        

        let content = ev.clipboardData.getData('Text')        

        this.resetFromFen(content)
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

                if(gameFull.white.aiLevel) gameFull.white.name = `AI_level_${gameFull.white.aiLevel}`
                if(gameFull.black.aiLevel) gameFull.black.name = `AI_level_${gameFull.black.aiLevel}`

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

                this.writeBotChat(id, ["player"], oppMessage("Good luck", gameFull.opponentName))                
                poweredBy()

                let postBody = gameFull
                postBody.id = id

                fetch('/botgame', {
                    method: "POST",
                    headers: {
                       "Content-Type": "application/json"
                    },
                    body: JSON.stringify(postBody)
                })
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
            this.writeBotChat(id, ["player"], oppMessage("Good game", gameFull.opponentName))
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

            if(this.settings.disableOfferingDrawCheckbox.checked) offeringDraw = false

            if(offeringDraw) msg += " I would agree to a draw ."

            makeLichessBotMove(id, moveObj.bestmove, offeringDraw, this.USER().accessToken).then(result => {
                //this.botEventLogger.log(LogItem({text: "make move result", json: result}))
            })

            setTimeout(() => {                
                if(this.settings.showMoveInfoCheckbox.checked){
                    //this.writeBotChat(id, ["player", "spectator"], msg)
                }                

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

            let disableRated = this.settings.disableRatedCheckbox.checked
            let disableCasual = this.settings.disableCasualCheckbox.checked

            let rated = event.challenge.rated
            let casual = !rated

            if(rated && disableRated){
                ok = false
                status = "rated disabled"
            }

            if(casual && disableCasual){
                ok = false
                status = "casual disabled"
            }

            let disableBotOpponent = this.settings.disableBotOpponentCheckbox.checked

            let challenger = event.challenge.challenger
            let challTitle = challenger.title

            if(disableBotOpponent && (challTitle == "BOT")){
                ok = false
                status = "bot disabled"
            }

            let speed = event.challenge.speed

            let acceptSpeeds = this.settings.acceptSpeedsTextAreaInput.text

            if(acceptSpeeds){
                if(!acceptSpeeds.split(" ").includes(speed)){
                    ok = false
                    status = "wrong speed"    
                }
            }

            if(!this.settings.allowFastTimeControlsCheckbox.checked){
                if(event.challenge.timeControl.limit < 60){
                    ok = false
                    status = "initial clock < 60"
                }
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
            const GAME_START_DELAY = 30000
            let delay = 0
            let now = performance.now()
            console.log("last game started at", this.lastGameStartedAt)
            if(this.lastGameStartedAt){
                if( ( now - this.lastGameStartedAt ) < GAME_START_DELAY ){
                    this.lastGameStartedAt = this.lastGameStartedAt + GAME_START_DELAY
                    delay = Math.max(0, this.lastGameStartedAt - now)
                    console.log("scheduling game start with delay", delay)                    
                }else{
                    this.lastGameStartedAt = now    
                }
            }else{
                this.lastGameStartedAt = now
            }
            setTimeout(_ => this.playGame(event.game.id), delay)
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
        if(IS_PROD()) if(performance.now() - this.lastApiTick > 20 * QUERY_INTERVAL){
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

    setcommandVariantEngine(command, payload){
        let engineKey = VARIANT_TO_LOCAL_ENGINE[payload.variant || "standard"]
        if(!engineKey){
            this.shouldGo = false
            return
        }
        this.engine.setcommand(command, payload)
    }

    setShouldGo(value){
        this.shouldGo = value
        if(this.shouldGo) localStorage.setItem("shouldGo", "true")
        else localStorage.removeItem("shouldGo")
    }

    go(){
        this.setShouldGo(true)

        let payload = {            
            variant: this.variant,
            multipv: parseInt(this.settings.multipvCombo.selected) || DEFAULT_MULTIPV,
            fen: this.fen,
        }

        if(this.settings.useServerStockfishCheckbox.checked){
            payload.password = this.askPass(PROPS.ALLOW_SERVER_ENGINE)
            
            payload.threads = parseInt(this.settings.threadsCombo.selected) || DEFAULT_THREADS,

            api("engine:go", payload, response => {
                this.clog(response)
                if(!response.ok) this.setShouldGo(false)
            })
        }else{            
            this.setcommandVariantEngine("go", payload)
        }
    }

    stop(){
        this.setShouldGo(false)

        if(this.settings.useServerStockfishCheckbox.checked){
            api("engine:stop", {
                variant: this.variant,
                password: this.askPass(PROPS.ALLOW_SERVER_ENGINE),
            }, response => {
                this.clog(response)
            })
        }else{            
            this.setcommandVariantEngine("stop", {})
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
        if(!IS_LICHESS_PROVIDER()) return
        if(!this.settings.allowFreshGamesCheckbox.checked) return

        return P(resolve => {
            this.games = []
            this.gamesLoadTime = null
            this.buildGames()

            let fetchStarted = performance.now()

            getLichessGames(
                this.username(),
                {
                    max: parseInt(this.settings.fetchMaxFreshGamesCombo.selected)
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
                .pad(1).mar(1).w(100).fs(16).html(lm.san)
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

    advancedSearch(){
        let line = this.g.line(false, this.g.getcurrentnode(), false, true)
        
        if(typeof PROPS != "undefined"){
            if(typeof PROPS.USER != "undefined"){
                if(PROPS.USER.provider == "lichess"){
                    let url = `http://fbserv.herokuapp.com/games.html?username=${PROPS.USER.username}&token=${PROPS.USER.accessToken}&color=${this.g.flip ? "black" : "white"}&eco=${line}&autocreatecode=true&autostart=true&variant=${this.variant}&oppkind=human`                    
                    window.open(url)
                }                
                return
            }
        }

        this.alert("Log in with lichess to be able to search", "error")
    }

    buildMoves(decorateOpt){        
        this.decorate = decorateOpt || this.decorate

        let lms = this.board.getlms(RICH, this.decorate ? ( this.decorate.fen == this.fen ? this.decorate : null ) : null).sort((a,b) => a.san.localeCompare(b.san))                

        lms.sort((a,b) => b.evalWeight - a.evalWeight)

        lms.sort((a,b) => (b.sortweight - a.sortweight))

        this.movesDiv.x().ame(
            div().hh(this.board.boardsize() - MOVESDIV_HEIGHT_CORRECTION).df().a(
                div().ovfys().a(
                    [div().mar(3).a(Button("Search moves in advanced search", this.advancedSearch.bind(this)))].concat(lms.map(lm => this.createNodeForLegalMove(lm)))
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
                .mart(4).w(GAME_TEXT_AREA_WIDTH).hh(PGN_TEXT_AREA_HEIGHT)
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
        this.mergeMoveListStr(moveListStr, MERGE_ALL_MOVES, MERGE_SILENT)
    }

    mergeMoveList(moves, mergeAll, silent){
        if(!mergeAll) moves = moves.slice(0, Math.min(moves.length, parseInt(this.settings.mergeDepthCombo.selected)))

        let game = Game({variant: this.variant}).fromsans(moves)

        let result = this.g.merge(game)

        if(!silent) this.alert(result, "info")                

        this.board.positionchanged()
    }

    mergeMoveListStr(content, mergeAll, silent){
        let moves = content.split(/ |\./).filter(item=>item.match(/^[a-zA-Z]/))        

        this.mergeMoveList(moves, mergeAll, silent)
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
            .w(node.gensan ? 140 : 600).cp().pad(2).mar(1)
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
        //console.log(this.g)
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

        if(this.settings.allowLichessBookCheckbox.checked) this.requestLichessBook()
        else this.decorate = null

        this.doLater("buildMoves", POSITION_CHANGED_DELAY)
        this.doLater("showTranspositions", POSITION_CHANGED_DELAY)
        this.doLater("showTree", 2 * POSITION_CHANGED_DELAY)
        this.doLater("buildAnimsDiv", POSITION_CHANGED_DELAY)
        this.doLater("showFilterBook", 2 * POSITION_CHANGED_DELAY)
        this.doLater("showChart", POSITION_CHANGED_DELAY)
        this.doLater("storeDefault", STORE_DEFAULT_DELAY)
        if(this.settings.animate3dCheckbox.checked) this.render3d()
        else this.doLater("render3d", POSITION_CHANGED_DELAY)

        this.boardExportPreviewCanvasHook.x()

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

    render3d(){
        if(this.settings.disable3dBoardCheckbox.checked) return

        if(this.threeBoard.ready) this.threeBoard.setFromGame(this.g)
        else this.doLater("render3d", 1000)
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

        if(IS_PROD()) if(elapsed > ( 2 * QUERY_INTERVAL ) ){
            this.alert(`Server stream timed out, setting up new. If the problem persists, reload the page.`, "error")

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

    showOnline(online){
        this.table.showOnline(online)
    }

    showGames(games){
        this.table.showGames(games)
    }

    analyzeGame(game){
        this.ubertabs.selectTab("analyze")
        this.tabs.selectTab("moves")
        this.board.setgame(game)
    }

    setupsourceFunc(){
        //this.clog(`setting up event source with interval ${QUERY_INTERVAL} ms`)        

        this.source = new EventSource('/stream')

        this.source.addEventListener('message', e => {                        
            let analysisinfo = JSON.parse(e.data)               
            console.log(analysisinfo)              
            analysisinfo.kind = analysisinfo.kind || "engine"
            let m            
            if(analysisinfo.kind == "tick"){
                this.lasttick = performance.now()
            }else if(analysisinfo.kind == "online"){
                this.showOnline(analysisinfo.online)
            }else if(m = analysisinfo.kind.match(/^play:(.+)$/)){
                this.table.processApi(m[1], analysisinfo)
            }else{                
                this.processanalysisinfo(analysisinfo)
            }            
        }, false)

        this.source.addEventListener('open', _ => {            
            //this.clog("connection opened")
        }, false)

        this.source.addEventListener('error', e => {
            if (e.readyState == EventSource.CLOSED) {                
                //this.clog("connection closed")
            }else{
                //document.location.href = "about:blank"
                this.source.close()
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

    alert(msgOpt, kindOpt, alertDelayOpt){        
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

        this.doLater("hideAlert", alertDelayOpt || ALERT_DELAY)
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

    initMediaRecorder(canvasElement) {
        this.allChunks = []
        this.stream = canvasElement.captureStream()        
        this.recorder = new MediaRecorder(this.stream, {mimeType: 'video/webm'})

        this.recorder.ondataavailable = e => {
            console.log(`data handler called`)
            if (e.data) {
                console.log(`data available: ${e.data.size}`)
                if (e.data.size > 0) {
                    console.log(`data added`)
                    this.allChunks.push(e.data)
                }
            } else {
                console.error(`data handler received no data in event: ${JSON.stringify(e)}`)
            }
        }

        this.recorder.onstart = e => {
            console.log(`recording started`)
        }

        this.recorder.onstop = e => {
            console.log(`recording stopped`)

            const fullBlob = new Blob(this.allChunks)

            console.log(`generated video size: ${fullBlob.size} bytes, number of chunks ${this.allChunks.length}`)

            this.videoExportLink = a()
                .marl(10).mart(10).fs(18).href("#")
                .html("Save video to file")
            
            this.videoDownloadLinkHook.x().a(this.videoExportLink)

            this.videoExportLink.e.href = window.URL.createObjectURL(fullBlob)
            this.videoExportLink.e.download = 'chess.webm'

            if(IS_PROD()) this.videoExportLink.e.click()
        }

        this.recorderDelay = parseInt(this.settings.videoAnimationDelayCombo.selected * 1000)

        return this.recorder
    }

    animateMove(){
        this.drawBoardOnCanvas(this.videoCanvas, this.moveAnimationState)
        this.videoAnimationInfo.bc("#aaf").html(`animating move ${this.b.movetosan(this.moveAnimationState.move)} phase ${this.moveAnimationState.i}`)
        this.moveAnimationState.i++
        if(this.moveAnimationState.i == this.videoGranularity){
            this.board.forward()            
            setTimeout(_ => {
                window.requestAnimationFrame(this.animateVideo.bind(this))
            }, this.recorderDelay / this.videoGranularity)
        }else{
            setTimeout(_ => {
                window.requestAnimationFrame(this.animateMove.bind(this))
            }, this.recorderDelay / this.videoGranularity)
        }
    }

    phaseOffVideo(){
        if(this.phaseOffVideoCounter){
            this.videoAnimationInfo.bc("#faa").html(`phasing off video ${this.phaseOffVideoCounter}`)
            this.videoCanvas.fillStyle("#000")
            this.videoCanvas.globalAlpha(0.1)
            let bs = this.board.boardsize()
            this.videoCanvas.fillRect(Vect(0, 0), Vect(bs, bs))
            this.phaseOffVideoCounter--
            setTimeout(_ => {                
                this.phaseOffVideo()
            }, this.recorderDelay)            
        }else{
            this.videoAnimationInfo.bc("#afa").html(`recording done`)
            this.recorder.stop()
        }
    }

    animateVideo(){                
        this.drawBoardOnCanvas(this.videoCanvas)
        let fwm = this.g.getForwardMove()                
        if(fwm){                        
            this.moveAnimationState = {
                move: fwm,
                i: 0
            }                        
            setTimeout(_ => {
                window.requestAnimationFrame(this.animateMove.bind(this))
            }, this.recorderDelay / this.videoGranularity)            
        }else{                                                            
            setTimeout(_ => {                
                this.phaseOffVideoCounter = 20
                this.phaseOffVideo()
                //this.recorder.stop()
            }, this.recorderDelay)            
        }        
    }

    recordMainLineAsVideo(){
        this.videoDownloadLinkHook.x().a(
            this.videoCanvas = Canvas({width: this.board.boardsize(), height: this.board.boardsize()})
        )

        this.board.tobegin()

        this.initMediaRecorder(this.videoCanvas.e)

        this.recorder.start()

        this.videoGranularity = parseInt(this.settings.videoAnimationGranularityCombo.selected)        
        
        window.requestAnimationFrame(this.animateVideo.bind(this))
    }

    playRandomMoves(){
        this.playRandomMovesDelay = parseInt(this.settings.videoAnimationDelayCombo.selected * 1000)

        let move = this.g.getRandomMove()

        if(move){
            this.randomAnimationInfo.bc(GREEN_BUTTON_COLOR).html(`making random move ${this.b.movetosan(move)}`)

            this.board.makeMove(move)

            this.playRandomMoveTimeout = setTimeout(_ => {
                this.playRandomMoves()
            }, this.playRandomMovesDelay)
        }
    }

    stopPlayingRandomMoves(){
        if(this.playRandomMoveTimeout){
            clearTimeout(this.playRandomMoveTimeout)
            this.playRandomMoveTimeout = null
            this.randomAnimationInfo.bc(RED_BUTTON_COLOR).html(`playing random moves stopped`)
        }
    }

    renderRandomDiv(){
        return div().a(
            div().mar(5).a(
                div().dfc().a(
                    Button("Play random moves", this.playRandomMoves.bind(this)).fs(24).mar(5).bc(GREEN_BUTTON_COLOR),                
                    Button("Stop", this.stopPlayingRandomMoves.bind(this)).fs(24).mar(5).bc(RED_BUTTON_COLOR),                
                    this.randomAnimationInfo = div().pad(6).padl(12).padr(12).ffm().fs(16).dib().marl(10),
                )
            )
        )
    }

    renderVideoDiv(){
        return div().a(
            div().mar(5).a(
                div().dfc().a(
                    Button("Record main line as video", this.recordMainLineAsVideo.bind(this)).fs(24).mar(5).bc(MAGENTA_BUTTON_COLOR),                
                    this.videoAnimationInfo = div().pad(6).padl(12).padr(12).ffm().fs(16).dib().marl(10),
                ),
                this.videoDownloadLinkHook = div().mar(5)
            )
        )
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

    exportedBoardCanvas(){
        let bs = this.board.boardsize()

        let canvas = Canvas({width: bs, height: bs})

        for(let name of EXPORTED_CANVAS_NAMES){
            canvas.ctx.globalAlpha = 1
            if(name == "square") canvas.ctx.globalAlpha = DEFAULT_SQUARE_OPACITY
            if(!this.settings[name + "CanvasExportCheckboxInput"].checked){
                canvas.ctx.drawImage(this.board.getCanvasByName(name).e, 0, 0)    
            }            
        }

        return canvas
    }

    drawBoardOnCanvas(canvas, moveAnimationState){
        canvas.ctx.drawImage(this.board.getCanvasByName("background").e, 0, 0)
        canvas.ctx.globalAlpha = DEFAULT_SQUARE_OPACITY
        canvas.ctx.drawImage(this.board.getCanvasByName("square").e, 0, 0)
        canvas.ctx.globalAlpha = 1
        if((this.settings.highlightanimationmovesCheckbox.checked) && (!moveAnimationState))
            canvas.ctx.drawImage(this.board.getCanvasByName("highlight").e, 0, 0)        
        if(moveAnimationState){
            let animCanvas = Canvas({width: this.board.boardsize(), height: this.board.boardsize()})
            animCanvas.ctx.drawImage(this.board.getCanvasByName("piece").e, 0, 0)
            let move = moveAnimationState.move
            let fromp = this.b.pieceatsquare(move.fromsq)
            this.board.clearPiece(move.fromsq, animCanvas)
            let fromCoords = this.board.piececoords(move.fromsq)
            let toCoords = this.board.piececoords(move.tosq)
            let diff = toCoords.m(fromCoords)
            let coords = fromCoords.p(
                diff.s(moveAnimationState.i / this.videoGranularity)
            )
            let pd = Vect(this.board.piecesize() / 2, this.board.piecesize() / 2)
            if(this.settings.highlightanimationmovesCheckbox.checked){
                if(this.moveAnimationState.i)
                animCanvas.arrow(fromCoords.p(pd), coords.p(pd), {
                    scalefactor: this.board.arrowscalefactor()
                })
            }
            this.board.drawPiece(animCanvas, coords, fromp)
            canvas.ctx.drawImage(animCanvas.e, 0, 0)
        }else{
            canvas.ctx.drawImage(this.board.getCanvasByName("piece").e, 0, 0)
        }
        canvas.ctx.drawImage(this.board.getCanvasByName("drawings").e, 0, 0)
    }

    record(){return P(resolve => {
        let bs = this.board.boardsize()
        let props = this.getcurrentnode().props()

        let canvas = Canvas({width: 2 * bs, height: bs})

        canvas.fillStyle("#FFFFFF")
        canvas.fillRect(Vect(0,0), Vect(2*bs,bs))
        
        if(this.settings.animate3dCheckbox.checked){
            canvas.ctx.drawImage(this.threeBoard.threeRenderer.renderer.domElement, 0, 0)
        }else{
            this.drawBoardOnCanvas(canvas)
        }        

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

    loginWithDiscord(){
        document.location.href = DISCORD_LOGIN_URL
    }

    loginWithGitHub(){
        document.location.href = GITHUB_LOGIN_URL
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

    askPass(skip){
        if(skip) return "none"

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
        if(IS_DEV()) return this.renderMissingContent("production only")

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
            squaresize: parseInt(getLocal("app/ubertabpane/squaresizeCombo", {selected: DEFAULT_SQUARESIZE}).selected),
            positionchangedcallback: this.positionchanged.bind(this)
        })
    }

    createSetupBoard(){
        this.setupDiv.x().am(div().mar(5).a(this.setupBoard = SetupBoard({
            id: "setupboard",
            parentApp: this,
            squaresize: this.board.squaresize * 0.9
        })))
    }

    renderAnalysisInfoDiv(){
        return div().w(290).ovfs()
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
        let username = PROPS.USER ? USER_QUALIFIED_NAME() : "LOGIN"

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
            Tab({id: "video", caption: "Video", content: this.videoDiv}),            
            Tab({id: "random", caption: "Random", content: this.randomDiv}),            
            Tab({id: "threeanimation", caption: "Three Animation", content: this.threeAnimationDiv}),
            Tab({id: "settings", caption: "Settings", content: this.animSettingsDiv}),            
            Tab({id: "images", caption: "Images", content: this.imageDiv}),
        ])

        this.toolsTabPane = TabPane({id: "toolstabpane"}).setTabs([
            Tab({id: "log", caption: "Log", content: this.logDiv}),
            Tab({id: "multiPGN", caption: "Multi PGN", content: this.multiPGNDiv}),
            Tab({id: "fen", caption: "FEN", content: this.fenDiv}),
            Tab({id: "setup", caption: "Setup", content: this.setupDiv}),
            Tab({id: "study", caption: "Studies", content: this.studyDiv}),            
            Tab({id: "smartdom", caption: "Smartdom", content: this.smartdomDiv}),
            Tab({id: "tourney", caption: "Tourney", content: this.tourneyDiv}),
        ])

        this.tabs = TabPane({id: "maintabpane"}).setTabs([
            Tab({id: "moves", caption: "Moves", content: this.movesDiv})
                .toolTip({msg: "Moves, analysis, comments"}),            
            Tab({id: "three", caption: "3D", content: this.threeBoardDiv})
                .toolTip({msg: "3D Board"}),            
            this.transpositionsTab = 
            Tab({id: "transpositions", caption: "Transp", content: this.transpositionsDiv})
                .toolTip({msg: "Transpositions"}),            
            Tab({id: "games", caption: "Games", content: this.gamesTabPane})
                .toolTip({msg: "Lichess games"}),
            Tab({id: "train", caption: "Train", content: this.trainDiv})
                .toolTip({msg: "Training"}),            
            Tab({id: "tree", caption: "Tree", content: this.treeDiv})
                .toolTip({msg: "Study tree"}),            
            Tab({id: "bot", caption: "Bot", content: this.botTabPane})
                .toolTip({msg: "Lichess bot"}),                        
            Tab({id: "anims", caption: "Anims", content: this.animsTabPane})
                .toolTip({msg: "Animations"}),
            Tab({id: "backup", caption: "Backup", content: this.backupDiv})
                .toolTip({msg: "Backup application state"}),                        
            Tab({id: "users", caption: "Users", content: this.lichessUsersDiv})
                .toolTip({msg: "Lichess users"}),
            Tab({id: "tools", caption: "Tools", content: this.toolsTabPane})
                .toolTip({msg: "Tools ( Export game, report / set FEN / PGN, save / load Study )"})
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

        this.containerDiv = div().a(this.containerPane)

        this.containerDiv.resize = (width, height) => this.containerPane.resize(width, height)
        this.containerDiv.noScroll = true

        this.settingsTabPane = TabPane({id: "animstabpane"}).setTabs([
            Tab({id: "general", caption: "General", content: this.generalSettingsDiv}),            
            Tab({id: "engine", caption: "Engine", content: this.engineSettingsDiv}),            
            Tab({id: "lichess", caption: "Lichess", content: this.lichessSettingsDiv}),                        
        ])

        this.ubertabs = TabPane({id: "ubertabpane"}).setTabs([            
            Tab({id: "analyze", caption: "Analyze", content: this.containerDiv})
                .toolTip({msg: "Analyze"}),            
            Tab({id: "play", caption: "Play", content: this.playDiv})
                .toolTip({msg: "Play"}),            
            Tab({id: "feedback", caption: "Lichess game download / Advanced search and More", content: this.gameSearchDiv})
                .toolTip({msg: "Advanced lichess game search and download API, with more convenience and search power than lichess offers"}),            
            Tab({id: "feedback", caption: "Discussion / Feedback", content: this.feedbackDiv})
                .toolTip({msg: "Join Discord Server"}),            
            Tab({id: "settings", caption: "Settings", content: this.settingsTabPane})
                .toolTip({msg: "Settings"}),            
            Tab({id: "faq", caption: "Faq", content: this.faqDiv})
                .toolTip({msg: "Frequently asked questions"}),
            Tab({id: "about", caption: "About", content: this.aboutDiv})
                .toolTip({msg: "About easychess, ReadMe"}),
            Tab({
                id: "auth",
                caption: username,
                content: this.authDiv,
                backgroundColor: getProviderBackgroundColor(),
                selBackgroundColor: getProviderBackgroundColor(),                
            })                
                .ac(HAS_USER() ? "hasuser" : "blink_me")
                .bdr("solid", HAS_USER() ? 0 : 2, HAS_USER() ? "#777" : "#0f0")
                .toolTip({msg: "User login"}),            
        ])

        this.containerPane.setContent(this.tabs)

        this.mainPane.setContent(this.ubertabs)

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

    logOut(){
        document.location.href = "/logout"
    }

    renderAuthDiv(){
        let authDiv = div().a(
            div().bc("#777").pad(10).mar(5).a(                
                div().ac("blink_me").bc("#fff").tac().pad(10).fs(20).html(`To create a bot ( upgrade a normal lichess account to a bot account ) register a new lichess account or use an existing lichess account that has not played a game yet, then press 'Login with lichess-bot' while logged into that lichess account and when prompted, approve bot authorizations. While logged into easychess with your bot account, the bot will accept challenges and play games. Your bot can be configured in Analyze / Bot / Settings.`),
                div().bc("#bbf").mart(10).tac().pad(10).fs(20).html(`Note: The application is running on a free Heroku account, which has a monthly limit of 550 hours. The application may very well be down in the last week of the month due to exhausted quota and report Application error. In this case you can expect the application to be up again in the beginning of the next month.`),
                div().bc("#ffb").mart(10).tac().pad(10).fs(20).html(`If this application is down due to exhausted quota, try <a href="https://easychessreserve.herokuapp.com" rel="noopener noreferrer" target="_blank">easychessreserve.herokuapp.com</a> .`),
                div().bc("#fff").mart(10).tac().pad(10).fs(20).html(`<a href="https://github.com/easychessanimations/botlogin/commits/master" rel="noopener noreferrer" target="_blank">User login history</a> | <a href="https://github.com/easychessanimations/botgame/commits/main" rel="noopener noreferrer" target="_blank">Bot game history</a> | <a href="https://easychesslogpage.netlify.app/" rel="noopener noreferrer" target="_blank">Log page</a>`),
                div().tac().mart(10).bdr("solid", 5, "#fff", 20).bc("#000").pad(10).a(
                    Button("Login with lichess", this.loginWithLichess.bind(this)).fs(20).mar(5).pad(5).bc(PROVIDER_BACKGROUND_COLORS["lichess"]),
                    Button("Login with Discord", this.loginWithDiscord.bind(this)).fs(20).mar(5).pad(5).bc(PROVIDER_BACKGROUND_COLORS["discord"]),
                    Button("Login with GitHub", this.loginWithGitHub.bind(this)).fs(20).mar(5).pad(5).bc(PROVIDER_BACKGROUND_COLORS["github"]),
                    Button("Login with lichess-bot", this.loginWithLichessBot.bind(this)).fs(20).mar(5).pad(5).bc(YELLOW_BUTTON_COLOR),                
                    HAS_USER() ? Button("Log out", this.logOut.bind(this)).fs(20).mar(5).pad(5).bc("#f00").marl(50) : div(),                
                ),
                div().tac().op(0.3).mart(10).a(
                    Button("Set Password", this.setPassword.bind(this)).mar(5).marl(10).bc(BLUE_BUTTON_COLOR),
                    Button("Clear Password", this.clearPassword.bind(this)).mar(5).bc(RED_BUTTON_COLOR),                
                )
            )            
        )

        if(PROPS.USER){
            authDiv.a(
                div().pad(10).bc(PROVIDER_BACKGROUND_COLORS[PROVIDER()])
                .tac().mar(5).fs(20)
                .html("logged in with " + PROVIDER())
            )
            if(IS_LICHESS_PROVIDER()){
                if(PROPS.USER._json) if(PROPS.USER._json.perfs instanceof Object) authDiv.a(                    
                    table().marl(5).sa("cellpadding", 10).sa("border", 1).a(
                        Object.entries(PROPS.USER._json.perfs).map(perf => tr().a(
                            td().html(perf[0]).c("#00f"),
                            td().html(perf[1].games).c("#707").fwb(),
                            td().html(perf[1].rating).c("#070").fwb(),
                            td().html(perf[1].rd).c("#770").fwb()
                    )))
                )
            }            
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
                Button("i", this.reset.bind(this)).ff("lichess").bc(RED_BUTTON_COLOR)
                    .toolTip({msg: "Reset"}),
                Button("B", this.board.doflip.bind(this.board)).ff("lichess").bc(CYAN_BUTTON_COLOR)
                    .toolTip({msg: "Flip"}),
                Button("W", this.board.tobegin.bind(this.board)).ff("lichess").bc(BLUE_BUTTON_COLOR)
                    .toolTip({msg: "To begin"}),                
                Button("Y", this.board.back.bind(this.board)).ff("lichess").bc(GREEN_BUTTON_COLOR)
                    .toolTip({msg: "Back"}),
                Button("X", this.board.forward.bind(this.board)).ff("lichess").bc(GREEN_BUTTON_COLOR)
                    .toolTip({msg: "Forward"}),
                Button("V", this.board.toend.bind(this.board)).ff("lichess").bc(BLUE_BUTTON_COLOR)
                    .toolTip({msg: "To end"}),
                Button("L", this.delMove.bind(this)).ff("lichess").bc(RED_BUTTON_COLOR)
                    .toolTip({msg: "Delete move and subtree"}),
                this.gobutton = Button("Go", this.go.bind(this)).bc(GREEN_BUTTON_COLOR)
                    .toolTip({msg: "Engine go"}),                                  
                this.stopbutton = Button("Stop", this.stop.bind(this)).bc(IDLE_BUTTON_COLOR)
                    .toolTip({msg: "Engine stop"}),                                                  
                this.lichessbutton = Button("L", this.lichess.bind(this)).bc(YELLOW_BUTTON_COLOR)
                    .toolTip({msg: "Lichess analysis"}),                                                  
                Button("R", this.reloadPage.bind(this)).bc(YELLOW_BUTTON_COLOR)
                    .toolTip({msg: "Reload page"}),                                                                                        
                this.commandInput = TextInput().w(30).ae("keyup", this.commandChanged.bind(this)),                                
                Button("G", this.loadLatestGame.bind(this)).bc(GREEN_BUTTON_COLOR)
                    .toolTip({msg: "Load latest lichess game"}),                                                                                        
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
                    display: "Accept variants ( space separated variant keys )",          
                    text: "standard",                              
                    settings: this.settings
                }),
                TextAreaInput({
                    id: "acceptSpeedsTextAreaInput",                    
                    display: "Accept speeds ( space separated, empty for all )",                              
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "allowFastTimeControlsCheckbox",                    
                    display: "Allow fast time controls",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "disableCasualCheckbox",                    
                    display: "Disable casual",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "disableRatedCheckbox",                    
                    display: "Disable rated",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "disableBotOpponentCheckbox",                    
                    display: "Disable BOT opponent",                                        
                    settings: this.settings
                }),
                CheckBoxInput({
                    id: "showMoveInfoCheckbox",                    
                    display: "Show move info in chat",                                        
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
                CheckBoxInput({
                    id: "disableOfferingDrawCheckbox",                    
                    display: "Disable offering draw",                                        
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
    
    reset(){
        let variant = this.settings.variantCombo.selected
        if(!confirm(`Are you sure you want to delete all moves and create a new study with variant ${displayNameForVariant(variant)}?`, "reset")){
            this.alert(`Resetting to variant " ${variant} " canceled .`, "warning")
            return
        }
        this.board.reset(variant)
        this.alert(`Resetted study to variant " ${variant} " ok .`, "success")
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

        //app.clog(app)
        //app.clog(PROPS)
    },
    err => {
        console.log(err.content)
    }
)

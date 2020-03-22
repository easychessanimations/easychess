const ALLOW_NON_ID                  = true
const EXCEPT_THIS                   = true
const TOOLTIP_MARGIN                = 5

const DEFAULT_TOOLTIP_DELAY = 2000

var allNodes = {}

var toolTipElementHook = null

class SmartDomEvent{
    constructor(ev, e){
        this.ev = ev
        this.e = e        
        this.kind = ev.type        
        this.stopPropagation = false
    }

    get do(){return this.e.props.do}
    get path(){return this.e.path()}
}

class SmartDomElement{
    easeOnOut(opOpt){
        this.easeOnOutOp = opOpt || 0.3
        this.ae("mouseover mousein", this.handleEeasIn.bind(this))
        this.ae("mouseout", this.ease.bind(this))
        return this.ease()
    }

    ease(){
        this.op(this.easeOnOutOp)
        return this
    }

    handleEeasIn(){
        this.op(1)
        this.doLater("ease", this.props.easeDelay || 10000)
    }

    showToolTip(){
        if(!toolTipElementHook){
            let de = document.documentElement
            de.style.position = "relative"
            toolTipElementHook = div()
            de.appendChild(toolTipElementHook.e)
        }        
        
        toolTipElementHook.x().a(this.toolTipElement = div().op(0)
            .zi(1000).poa().ff("monospace").t(0).l(0).tac()
            .bc("#ddf").pad(4).bdr("solid", 2, "#777", 5)                        
            .html(this.toolTipMessage)
        )
        setTimeout(this.positionTooltip.bind(this), 0)
    }

    positionTooltip(){
        let bcr = this.e.getBoundingClientRect()            
        let bcrt = this.toolTipElement.e.getBoundingClientRect()            
        let x = bcr.x + TOOLTIP_MARGIN
        if(this.toolTipAlignX == "center") x = bcr.x + bcr.width / 2 - bcrt.width / 2
        let y = bcr.y + bcr.height + TOOLTIP_MARGIN
        if(this.toolTipAlignY == "center") y = bcr.y + bcr.height / 2 - bcrt.height / 2
        if(x + bcrt.width + TOOLTIP_MARGIN > window.innerWidth) x = window.innerWidth - bcrt.width - TOOLTIP_MARGIN
        if(y + bcrt.height + TOOLTIP_MARGIN > window.innerHeight) y = window.innerHeight - bcrt.height - TOOLTIP_MARGIN
        this.toolTipElement.t(y).l(x).op(1)
    }

    hideToolTip(){
        if(toolTipElementHook) toolTipElementHook.x()
        if(this.toolTipTimeout){
            clearTimeout(this.toolTipTimeout)
            this.toolTipTimeout = null
        }
    }

    toolTipHover(){        
        if(!this.toolTipTimeout) this.toolTipTimeout = setTimeout(this.showToolTip.bind(this), this.toolTipDelay)
    }

    toolTip(props){
        this.toolTipMessage = props.msg
        this.toolTipDelay = props.delay || DEFAULT_TOOLTIP_DELAY
        this.toolTipAlignX = props.alignX || props.align
        this.toolTipAlignY = props.alignY || props.align
        this.ae("mouseover", this.toolTipHover.bind(this))
        this.ae("mouseout mousedown", this.hideToolTip.bind(this))
        return this
    }

    copy(){
        setTimeout(() => {
            this.focus().select()
            document.execCommand("copy")
        }, 0)        
    }

    dropHandler(ev){        
        switch(ev.type){
            case "dragenter":
            case "dragover":
                ev.preventDefault()
                this.bc(this.dragbc)
                break
            case "dragleave":
                this.bc(this.normalbc)
                break
            case "drop":
                ev.preventDefault()                    
                this.bc(this.normalbc)
                this.dropCallback(ev)
                break
        }
    }

    dropLogic(callback, normalbc, dragbc){
        this.normalbc = normalbc || "#777"        
        this.dragbc = dragbc || "#7f7"
        this.dropCallback = callback        
        this.bc(normalbc)
        this.ae("dragenter dragover dragleave drop", this.dropHandler.bind(this))
        return this
    }
    
    constructor(tagName, propsOpt){
        this.tagName = tagName

        this.e = document.createElement(this.tagName)

        this.props = propsOpt || {}

        this.id = this.props.id || null

        this.pathId = UID()

        this.settings = this.props.settings || {}

        this.childs = []
        this.parent = null

        if(this.props.ev){
            this.ae(this.props.ev, this.handleEventAgent.bind(this))
        }

        this.timeouts = {}
    }

    doLater(func, delay){        
        if(this[func]){            
            let to = this.timeouts[func]
            if(to) clearTimeout(to)
            this.timeouts[func] = null
            this.timeouts[func] = setTimeout(this[func].bind(this), delay)
        }
    }

    mountedSmart(){
        this.pathId = `child${this.index}_${this.tagName}`
        this.state = this.getStoredState()                        
        if(IS_DEV()) allNodes[this.path(ALLOW_NON_ID)] = this
        if(this.init) this.init()
    }

    getStoredState(){
        if(this.id){            
            let stored = localStorage.getItem(this.path())                        
            if(stored){                
                return JSON.parse(stored)
            }else{
                return {}
            }
        }else{
            return {}
        }
    }

    storeState(){        
        if(this.id){            
            this.settings[this.id] = this.state
            let store = JSON.stringify(this.state)                                                
            localStorage.setItem(this.path(), store)
        }
    }

    idParent(allowNonId){
        if((!allowNonId) && this.props.idParent) return this.props.idParent

        let current = this

        do{            
            current = current.parent                                    
            if(current) if(current.id || allowNonId) return current
        }while(current)

        return null
    }

    idParentChain(allowNonId){
        let chain = []
        let current = this

        while(current){                             
            chain.unshift(current)
            current = current.idParent(allowNonId)
        }

        return chain
    }

    pathList(allowNonId){
        return this.idParentChain(allowNonId).map(ip => ip.id ? ip.id : ip.pathId)
    }

    path(allowNonId){
        return this.pathList(allowNonId).join("/")
    }

    handleEvent(sev){
        // should be implemented in subclasses
    }

    handleEventAgent(ev){                
        let sev = new SmartDomEvent(ev, this)        
        for(let ip of this.idParentChain().reverse()){                                    
            ip.handleEvent(sev)
            if(sev.stopPropagation) return
        }
    }

    addStyle(name, value){
        this.e.style[name] = value
        return this
    }

    focus(){this.e.focus(); return this}
    select(){this.e.select(); return this}
    ae(kinds, callback){
        for(let kind of kinds.split(" ")) this.e.addEventListener(kind, callback)
        return this
    }
    x(){
        this.e.innerHTML = ""
        this.childs = []
        return this
    }
    w(x){return this.addStyle("width", `${x}px`)}
    miw(x){return this.addStyle("minWidth", `${x}px`)}
    maw(x){return this.addStyle("maxWidth", `${x}px`)}
    ww(x){return this.miw(x).maw(x)}
    h(x){return this.addStyle("height", `${x}px`)}
    mih(x){return this.addStyle("minHeight", `${x}px`)}
    mah(x){return this.addStyle("maxHeight", `${x}px`)}
    hh(x){return this.mih(x).mah(x)}
    t(x){return this.addStyle("top", `${x}px`)}
    l(x){return this.addStyle("left", `${x}px`)}
    c(x){return this.addStyle("color", x)}
    bc(x){return this.addStyle("backgroundColor", x)}
    mar(x){return this.addStyle("margin", `${x}px`)}
    marl(x){return this.addStyle("marginLeft", `${x}px`)}
    mart(x){return this.addStyle("marginTop", `${x}px`)}
    marr(x){return this.addStyle("marginRight", `${x}px`)}    
    marb(x){return this.addStyle("marginBottom", `${x}px`)}
    pad(x){return this.addStyle("padding", `${x}px`)}
    padl(x){return this.addStyle("paddingLeft", `${x}px`)}
    padr(x){return this.addStyle("paddingRight", `${x}px`)}
    padt(x){return this.addStyle("paddingTop", `${x}px`)}
    padb(x){return this.addStyle("paddingBottom", `${x}px`)}
    disp(x){return this.addStyle("display", x)}    
    df(x){return this.disp("flex")}        
    dib(x){return this.disp("inline-block")}    
    show(x){return this.disp(x ? "initial" : "none")}
    fd(x){return this.addStyle("flexDirection", x)}    
    ai(x){return this.addStyle("alignItems", x)}    
    jc(x){return this.addStyle("justifyContent", x)}    
    dfc(){return this.df().ai("center")}
    dfco(){return this.df().fd("column")}
    dfcc(){return this.df().fd("column").ai("center")}
    dfca(){return this.dfc().jc("space-around")}
    flw(x){return this.addStyle("flexWrap", x)}    
    flww(){return this.flw("wrap")}
    flwn(){return this.flw("no-wrap")}
    pos(x){return this.addStyle("position", x)}    
    por(){return this.pos("relative")}
    poa(){return this.pos("absolute")}
    ovf(x){return this.addStyle("overflow", x)}
    ovfs(){return this.ovf("scroll")}
    ovfh(){return this.ovf("hidden")}
    ovfx(x){return this.addStyle("overflowX", x)}
    ovfxs(){return this.ovfx("scroll")}
    ovfxh(){return this.ovfx("hidden")}
    ovfy(x){return this.addStyle("overflowY", x)}
    ovfys(){return this.ovfy("scroll")}
    ovfyh(){return this.ovfy("hidden")}
    cur(x){return this.addStyle("cursor", x)}
    cp(){return this.cur("pointer")}
    cm(){return this.cur("move")}
    sa(key, value){this.e.setAttribute(key, value); return this}
    //ac(x){return this.sa("class", x)}
    ac(x){
        this.e.classList.add(x)
        return this
    }
    rc(x){
        this.e.classList.remove(x)
        return this
    }
    acs(x){
        x.split(" ").forEach(klass => this.ac(klass))
        return this
    }
    dir(x){return this.addStyle("direction", x)}
    zi(x){return this.addStyle("zIndex", x)}
    op(x){return this.addStyle("opacity", x)}
    fs(x){return this.addStyle("fontSize", `${x}px`)}
    fw(x){return this.addStyle("fontWeight", x)}
    fwb(){return this.fw("bold")}
    ff(x){return this.addStyle("fontFamily", x)}
    ffm(){return this.ff("monospace")}
    bdrs(x){return this.addStyle("borderStyle", x)}
    bdrw(x){return this.addStyle("borderWidth", `${x}px`)}
    bdrc(x){return this.addStyle("borderColor", x)}
    bdrr(x){return this.addStyle("borderRadius", x)}
    bdr(x,y,z,r){return this.bdrs(x).bdrw(y).bdrc(z).bdrr(`${r}px`)}
    drg(x){return this.sa("draggable", x)}
    drgb(){return this.drg("true")}
    value(){return this.e.value}
    setValue(x){this.e.value = x; return this}
    float(x){return this.addStyle("float", x)}
    ta(x){return this.addStyle("textAlign", x)}
    tac(){return this.ta("center")}
    siv(x){this.e.scrollIntoView(x); return this}
    bimg(x){return this.addStyle("backgroundImage", x)}

    html(x){this.e.innerHTML = x; return this}

    idSub(id){        
        let icl1 = this.allChilds(null, null, null, EXCEPT_THIS).idChildsLevel[1]        
        if(!icl1) return 0
        return icl1.find(child => child.id == id)
    }

    idSubState(id){
        let is = this.idSub(id)
        if(!is) return null
        return is.state
    }

    allChilds(accOpt, levelOpt, idLevelOpt, exceptThisOpt){
        let level = levelOpt || 0
        let idLevel = idLevelOpt || 0
        let exceptThis = exceptThisOpt || false

        let acc = accOpt || {            
            allChilds: [],
            childsLevel: {},
            allIdChilds: [],
            idChildsLevel: {},
        }

        if(!acc.childsLevel[level]) acc.childsLevel[level] = []
        if(!acc.idChildsLevel[idLevel]) acc.idChildsLevel[idLevel] = []

        if( ! ( (level == 0) && (exceptThis) ) ){
            acc.allChilds.push(this)
            acc.childsLevel[level].push(this)
            if(this.id){
                acc.allIdChilds.push(this)
                acc.idChildsLevel[idLevel].push(this)
            }
        }

        for(let child of this.childs){
            acc = child.allChilds(acc, level + 1, idLevel + (this.id ? 1 : 0))
        }

        return acc
    }

    a(...childs){
        let childList = []
        for(let child of childs){
            if(child instanceof Array) childList = childList.concat(child)
            else childList.push(child)
        }
        let index = 0
        for(let child of childList){
            child.parent = this
            child.index = index++
            this.childs.push(child)
            this.e.appendChild(child.e)
        }        
        return this
    }

    mountSmart(exceptThisOpt){
        let acc = this.allChilds(null, null, null, exceptThisOpt)
        for(let child of acc.allChilds){
            child.mountedSmart()
        }
    }

    am(...childs){
        this.a(...childs)
        this.mountSmart()
        return this
    }

    ame(...childs){
        this.a(...childs)
        this.mountSmart(EXCEPT_THIS)
        return this
    }
}

class div_ extends SmartDomElement{
    constructor(propsOpt){
        super("div", propsOpt)
    }
}
function div(props){return new div_(props)}

class button_ extends SmartDomElement{
    constructor(props){
        super("button", props)
    }
}
function button(props){return new button_(props)}

class Button_ extends button_{
    constructor(caption, callback, props){
        super("button", props)
        this.html(caption)
        if(callback) this.ae("mousedown", callback)
    }
}
function Button(caption, callback){return new Button_(caption, callback)}

class input_ extends SmartDomElement{
    constructor(props){
        super("input", props)
        
        this.sa("type", this.props.type)
    }
}
function input(props){return new input_(props)}

class Slider_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.sliderWidth = this.props.sliderWidth || 150
        this.textWidth = this.props.textWidth || 150

        this.a(
            div().dfc().a(
                this.numdiv = div().fwb().pad(3).mar(2).ww(60).hh(20).bc("#ddd").c("#00f"),
                this.slider = input({type: "range"}).ww(this.sliderWidth).ae("input", this.sliderChanged.bind(this)),
                this.text = input({type: "text"}).ww(this.textWidth).marl(3).ae("keyup", this.textChanged.bind(this)),
            )
        )
    }

    sliderChanged(){
        this.state.value = this.slider.value()        
        this.setFromState()
    }

    textChanged(){
        let m = this.text.value().match(/([\d]+)[^\d]+([\d]+)[^\d]+([\d]+)[^\d]+([\d]+)/)
        if(m){            
            [ this.state.value, this.state.min, this.state.max, this.state.step ] = m.slice(1,5).map(x => parseInt(x));            
        }        
        this.doLater("setFromState", 2000)
    }

    setFromState(){
        this.state.min = this.state.min || 0
        this.state.max = this.state.max || 100
        this.state.step = this.state.step || 1
        this.state.value = this.state.value || 0
        this.slider.sa("min", this.state.min)
        this.slider.sa("max", this.state.max)
        this.slider.sa("step", this.state.step)
        this.slider.setValue(this.state.value)
        this.text.setValue(`${this.state.value} [ ${this.state.min} - ${this.state.max} ... ${this.state.step} ]`)
        this.numdiv.html(`${this.state.value}`)
        this.storeState()
    }

    init(){        
        this.setFromState()
    }
}
function Slider(props){return new Slider_(props)}

class TextInput_ extends input_{
    constructor(props){
        super({...{type: "text"}, ...props})
    }

    init(){        
        this.ae("keyup", this.textChanged.bind(this))
        this.ae("change", this.textChanged.bind(this))
        this.setFromState()
    }

    textChanged(){        
        this.state.text = this.value()
        this.storeState()
        if(this.props.changeCallback) this.props.changeCallback(this.value())
    }

    setFromState(){
        this.state.text = this.state.text || ""
        this.setValue(this.state.text)
        this.storeState()
    }
}
function TextInput(props){return new TextInput_(props)}

class TextAreaInput_ extends SmartDomElement{
    constructor(props){
        super("textarea", props)
    }

    setCopy(content){
        this.setValue(content).focus().select()
        document.execCommand("copy")
        setTimeout(() => this.focus().select(), 50)
    }

    init(){        
        this.ae("input", this.textChanged.bind(this))
        if(typeof this.props.text != "undefined") this.state.text = this.props.text
        this.setFromState()
    }

    textChanged(){        
        this.state.text = this.value()
        this.storeState()
        if(this.props.changeCallback) this.props.changeCallback(this.state.text)
    }

    setFromState(){
        this.state.text = this.state.text || ""
        this.setValue(this.state.text)
        this.storeState()
    }
}
function TextAreaInput(props){return new TextAreaInput_(props)}

class DateInput_ extends input_{
    constructor(props){
        super({...{type: "date"}, ...props})
    }

    init(){        
        this.ae("keyup", this.dateChanged.bind(this))
        this.ae("change", this.dateChanged.bind(this))
        this.setFromState()
    }

    dateChanged(){        
        this.state.date = this.value()
        this.storeState()
    }

    setFromState(){
        this.state.date = this.state.date || "2020-01-01"
        this.setValue(this.state.date)
        this.storeState()
    }
}
function DateInput(props){return new DateInput_(props)}

class TimeInput_ extends input_{
    constructor(props){
        super({...{type: "time"}, ...props})
    }

    init(){        
        this.ae("keyup", this.timeChanged.bind(this))
        this.ae("change", this.timeChanged.bind(this))        
        this.setFromState()
    }

    timeChanged(){        
        this.state.time = this.value()
        this.storeState()
    }

    setFromState(){
        this.state.time = this.state.time || "00:00"
        this.setValue(this.state.time)
        this.storeState()
    }
}
function TimeInput(props){return new TimeInput_(props)}

class DateTimeInput_ extends input_{
    constructor(props){
        super({...{type: "datetime-local"}, ...props})
    }

    init(){                
        this.ae("input", this.dateTimeChanged.bind(this))        
        this.setFromState()
    }

    dateTimeChanged(){        
        this.state.dateTime = this.value()
        this.storeState()
        if(this.props.changeCallback) this.props.changeCallback(this.value())
    }

    setFromState(){
        this.state.dateTime = this.state.dateTime || "2020-01-01T00:00"
        this.setValue(this.state.dateTime)
        this.storeState()
    }
}
function DateTimeInput(props){return new DateTimeInput_(props)}

class ColorInput_ extends input_{
    constructor(props){
        super({...{type: "color"}, ...props})
    }

    init(){        
        this.ae("keyup", this.colorChanged.bind(this))
        this.ae("change", this.colorChanged.bind(this))        
        this.setFromState()
    }

    colorChanged(){        
        this.state.color = this.value()
        this.storeState()
    }

    setFromState(){
        this.state.color = this.state.color || "#ffffff"
        this.setValue(this.state.color)
        this.storeState()
    }
}
function ColorInput(props){return new ColorInput_(props)}

class CheckBoxInput_ extends input_{
    constructor(props){
        super({...{type: "checkbox"}, ...props})
    }

    init(){                        
        this.ae("change", this.checkedChanged.bind(this))                
        if(this.props.forceChecked) this.state.checked = this.props.forceCheckedValue
        this.setFromState()
    }

    checkedChanged(){                
        this.state.checked = this.e.checked
        this.storeState()
        if(this.props.changeCallback) this.props.changeCallback(this.state.checked, this.id)
    }

    setChecked(checked){
        this.state.checked = checked
        this.e.checked = checked
        this.storeState()
        return this
    }

    setFromState(){
        this.state.checked = this.state.checked || false
        this.e.checked = this.state.checked
        this.storeState()
    }
}
function CheckBoxInput(props){return new CheckBoxInput_(props)}

class ComboOption_ extends SmartDomElement{
    constructor(props){
        super("option", props)
    }

    init(){
        this.sa("value", this.props.value).html(this.props.display)
        if(this.props.selected) this.sa("selected", true)
    }
}
function ComboOption(props){return new ComboOption_(props)}

class Combo_ extends SmartDomElement{
    constructor(props){
        super("select", props)        
    }

    change(){        
        if(this.id){
            this.state.selected = this.value()
            this.storeState()
        }
        if(this.props.changeCallback) this.props.changeCallback(this.value())
    }

    getSelIndex(){
        return this.props.options.findIndex(opt => opt.value == this.state.selected)        
    }

    step(delta){
        let index = this.getSelIndex()
        if(index >= 0){
            index += delta
            if(index >= this.props.options.length) index = this.props.options.length - 1
            if(index < 0) index = 0
            this.state.selected = this.props.options[index].value
            this.buildAndStoreState()
            if(this.props.changeCallback) this.props.changeCallback(this.value())
        }
    }

    buildAndStoreState(){
        this.x().ame(
            this.props.options.map(option => (
                ComboOption({value: option.value, display: option.display, selected: option.value == this.state.selected})
            ))
        )
        this.storeState()
    }

    init(){        
        this.ae("change", this.change.bind(this))              
        if(typeof this.state.selected == "undefined") this.state.selected = this.props.selected
        this.buildAndStoreState()
    }
}
function Combo(props){return new Combo_(props)}

class IncCombo_ extends SmartDomElement{
    constructor(props){
        super("div", props)        
    }

    step(delta){
        this.combo.step(delta)
    }

    init(){        
        this.dfc().ame(
            Button("-", this.step.bind(this, -1)),
            this.combo = Combo(this.props),
            Button("+", this.step.bind(this, 1))
        )
    }
}
function IncCombo(props){return new IncCombo_(props)}

class OptionElement_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.editOn = false
    }

    buildEditDiv(){
        let ip = this.idParent()

        if(this.editOn){
            let options = this.idParent().props.isContainer ?
                [
                    {value: "editablelist", display: "Editable List"},
                    {value: "editablelistcontainer", display: "Editable List Container"},
                    {value: "multipleselect", display: "Multiple Select"},
                    {value: "radiogroup", display: "Radio Group"},
                    {value: "slider", display: "Slider"},
                    {value: "text", display: "Text"},
                    {value: "textarea", display: "Text Area"},
                    {value: "date", display: "Date"},
                    {value: "time", display: "Time"},
                    {value: "datetime", display: "Date Time"},
                    {value: "color", display: "Color"},
                    {value: "checkbox", display: "Checkbox"},
                    {value: "button", display: "Button"},
                    {value: "clone", display: "Clone Selected Option"},
                ]
            :
                [{value: "scalar", display: "Scalar"}]            
            this.editDiv.x().ame(
                div().dfc().ww(ip.optionEditDivWidth).hh(ip.height)
                    .bc(ip.optionEditDivBackgroundColor)
                    .pad(ip.optionEditDivPadding)
                    .mar(ip.optionEditDivMargin).a(
                        div()
                            .ww(ip.optionEditDivWidth / 4).ovf("auto")
                            .bc("#ccc").fs(ip.widgetFontSize * 0.8)
                            .padl(ip.textPadding * 2).padr(ip.textPadding * 2)                            
                            .html(this.props.option.value),
                        Combo({
                            changeCallback: this.kindChanged.bind(this),
                            selected: this.props.option.kind,
                            options: options
                        })
                            .ww(ip.optionEditDivWidth / 3)
                            .marl(ip.separationMargin)
                            .fs(ip.optionEditComboFontSize),
                        Button("Display", this.changeDisplay.bind(this))
                            .ww(ip.optionEditDivWidth / 4)
                            .marl(ip.separationMargin)
                            .fs(ip.widgetButtonFontSize * 0.9),                        
                    )
            )            
        }else{
            this.editDiv.x()
        }
    }

    propertyChanged(key, value){
        this.props.option[key] = value
        this.editOn = false
        this.build()
        this.idParent().storeState()
    }

    kindChanged(kind){        
        if(kind == "clone"){
            this.idParent().cloneToOption(this.props.option.value)
        }else{            
            this.propertyChanged("kind", kind)
        }
    }

    changeDisplay(){
        let display = window.prompt("Display :", this.props.option.display)
        this.propertyChanged("display", display)
    }

    editKind(){
        this.editOn = !this.editOn
        this.buildEditDiv()
    }

    optionHandler(option){
        return this.idParent().optionClicked.bind(this.idParent(), option, this)         
    }

    labeledOptionElement(option, element){
        let ip = this.idParent()

        this.labelDiv = div().ww(ip.optionLabelWidth)
            .marr(ip.optionLabelMarginRight).pad(ip.optionLabelPadding)
            .fs(ip.optionLabelFontSize)
            .bdr(ip.optionLabelBorderStyle, ip.optionLabelBorderWidth, ip.optionLabelBorderColor, ip.optionLabelBorderRadius)
            .bc(ip.optionLabelBackgroundColor).cp()
            .html(option.display)
            .ae("click", this.optionHandler(option))

        return div().dfc().a(
            this.labelDiv,            
            element
        )
    }

    elementForOption(){
        let option = this.props.option
        let isContainer = false
        let label = null
        let ip = this.idParent()

        switch(option.kind){
            case "editablelistcontainer":                
                isContainer = true
                label = option.display
            case "editablelist":                            
                return this.labeledOptionElement(
                    option,
                    EditableList({
                        optionChild: true,
                        idParent: ip,
                        isContainer: isContainer,
                        label: label,
                        id: option.value,
                        width: ip.childEditableListWidth,
                        height: ip.height
                    })
                )
            case "multipleselect":
                return this.labeledOptionElement(
                    option,
                    MultipleSelect({
                        idParent: ip,
                        id: option.value,
                        width: ip.widgetWidth
                    })
                )
            case "radiogroup":
                    return this.labeledOptionElement(
                        option,
                        MultipleSelect({
                            radio: true,
                            idParent: ip,
                            id: option.value,
                            width: ip.widgetWidth
                        })
                    )
            case "slider":                            
                return this.labeledOptionElement(
                    option,
                    Slider({
                        idParent: ip,
                        id: option.value
                    })
                )
            case "text":                            
                return this.labeledOptionElement(
                    option,
                    TextInput({
                        idParent: ip,
                        id: option.value,
                        changeCallback: ip.optionChanged.bind(ip)
                    })
                    .fs(ip.widgetFontSize).ffm()                    
                    .pad(ip.widgetPadding)
                    .ww(ip.widgetWidth)
                )
            case "textarea":                            
                return this.labeledOptionElement(
                    option,
                    TextAreaInput({
                        idParent: ip,
                        id: option.value
                    })
                    .fs(ip.widgetFontSize)
                    .pad(ip.widgetPadding)
                    .ww(ip.widgetWidth)
                    .mih(ip.height * 4)
                )
            case "date":                            
                return this.labeledOptionElement(
                    option,
                    DateInput({
                        idParent: ip,
                        id: option.value
                    }).fs(ip.widgetFontSize).pad(ip.widgetPadding)
                )
            case "time":                            
                return this.labeledOptionElement(
                    option,
                    TimeInput({
                        idParent: ip,
                        id: option.value
                    }).fs(ip.widgetFontSize).pad(ip.widgetPadding)
                )
            case "datetime":                            
                return this.labeledOptionElement(
                    option,
                    DateTimeInput({
                        idParent: ip,
                        id: option.value
                    }).fs(ip.widgetFontSize).pad(ip.widgetPadding)
                )
            case "color":                            
                return this.labeledOptionElement(
                    option,
                    ColorInput({
                        idParent: ip,
                        id: option.value
                    }).fs(ip.widgetFontSize).pad(ip.widgetPadding)
                )
            case "checkbox":                            
                return this.labeledOptionElement(
                    option,
                    CheckBoxInput({
                        idParent: ip,
                        id: option.value
                    }).hh(ip.optionCheckBoxSize).ww(ip.optionCheckBoxSize)
                )
            case "button":                            
                return this.labeledOptionElement(
                    option,
                    button({
                        value: option.value,
                        ev: "click",
                        do: "handleWidgetButtonPressed",
                        idParent: ip,
                        id: option.value
                    })
                    .html(option.display)
                    .fs(ip.widgetButtonFontSize).pad(ip.widgetPadding)
                )
            default:
                return div().addStyle("width", "100%").tac().cp().html(option.display)
                    .ae("click", this.optionHandler(option))
        }        
    }

    isSelected(){
        return this.props.option.value == this.idParent().state.selected.value
    }

    enableChanged(){
        let ip = this.idParent()

        this.elementDiv            
            .bc(this.isSelected() ? ip.optionSelectedBackgroundColor : ip.optionBackgroundColor)

        this.elementDiv
            .op(this.enableCheckBox.state.checked ? ip.optionEnabledOpacity : ip.optionDisabledOpacity)
    }

    build(){
        let option = this.props.option
        let ip = this.idParent()

        this.dragBox = div({
                ev: "dragstart dragenter dragover dragleave drop",
                do: "dragoption", option: option
            })
            .ww(ip.dragBoxSize).hh(ip.dragBoxSize).mar(ip.optionButtonLeftMargin)
            .cm().drgb().bc(ip.dragBoxColor)

        this.editOptionButton = Button("_", this.editKind.bind(this))
            .fs(ip.optionButtonFontSize).marl(ip.optionButtonLeftMargin).bc(ip.editOptionButtonColor)

        this.enableCheckBox = CheckBoxInput({
            changeCallback: this.enableChanged.bind(this),
            idParent: ip, id: option.value + "#enable"
        })

        this.deleteButton = Button("X", ip.delOption.bind(ip, option))
            .fs(ip.optionButtonFontSize).marl(ip.optionButtonLeftMargin).bc(ip.deleteButtonColor)

        this.elementDiv = div().ww(ip.elementDivWidth).dfc().por().mar(2).pad(2)
            .fs(ip.optionElementDivFontSize)

        this.x().ame(
            div().dfc().a(
                this.dragBox,
                this.editOptionButton,                
                this.enableCheckBox,
                this.elementDiv.a(
                    this.elementForOption(),
                    this.editDiv = div().zi(ip.editDivZIndex).poa()
                ),                  
                this.deleteButton,                
            )
        )

        this.enableChanged()

        if(this.isSelected()){
            setTimeout(function(){this.siv()}.bind(this), 500)
        }
    }

    init(){                
        this.build()
    }
}
function OptionElement(props){return new OptionElement_(props)}

class MultipleSelect_ extends SmartDomElement{
    constructor(props){
        super("div", props)
    }

    init(){
        this.width = this.props.width || 400        

        if(this.props.forceOptions) this.state.options = this.props.options || []        
        this.state.options = this.state.options ? this.state.options : this.props.options || []        
        this.state.selected = this.state.selected ? this.state.selected : this.props.selected || []

        if(!this.state.selected.length){
            this.state.selected = this.state.options.slice(0, 1)
        }

        this.build()

        this.storeState()
    }

    findOptionByValue(value){
        return this.state.options.find(option => option.value == value)
    }

    addOption(){
        let value = window.prompt("Option Value :")
        let display = window.prompt("Option Display :")
        let opt = this.findOptionByValue(value)
        if(opt){
            opt.display = display
        }else{
            this.state.options.push({value: value, display: display})
        }
        this.build()
        this.storeState()
    }

    delOption(option){
        this.state.options = this.state.options.filter(opt => opt.value != option.value)
        this.build()
        this.storeState()
    }

    calcSelected(){
        this.state.selected = this.state.options.filter(option => getLocal(this.path() + "/" + option.value, {}).checked)        
    }

    selectedChanged(_, id){
        if(this.props.radio){            
            this.state.selected = this.state.options.filter(opt => opt.value == id)            
            this.build()
        }else{
            this.calcSelected()
        }
        if(this.props.changeCallback) this.props.changeCallback(this.state.selected)
        this.storeState()
    }

    selectById(id){
        this.selectedChanged(null, id)
    }

    build(){
        this.x().dib().ww(this.width).hh(this.height).bc("#eee")

        let addButton = this.props.hideAddButton ? div() : Button("+", this.addOption.bind(this))

        this.checkBoxInputs = {}

        this.ame(this.state.options.map(option =>
            div().bc("#bbb").mar(2).dib().a(
                div().dfc().a(
                    div().mar(2).pad(2).bc("#ddf").html(option.display),
                    this.checkBoxInputs[option.value] = CheckBoxInput({
                        idParent: this,
                        id: option.value,
                        changeCallback: this.selectedChanged.bind(this),
                        forceChecked: true,
                        forceCheckedValue: this.state.selected.find(opt => opt.value == option.value)
                    }).ww(16).hh(16),
                    this.props.hideDeleteButton ? div() : Button("X", this.delOption.bind(this, option)).bc("#fdd").fs(8).mar(2)
                )
            )            
        ))

        this.a(addButton.mar(5).bc("#afa"))

        this.calcSelected()
    }
}
function MultipleSelect(props){return new MultipleSelect_(props)}

class EditableList_ extends SmartDomElement{
    constructor(props){
        super("div", props)
    }

    optionChanged(){
        if(this.props.optionChangedCallback) this.props.optionChangedCallback(this.subState())
    }

    subState(){
        return this.state.options.map(opt => [opt.value, this.idSubState(opt.value)])
    }

    selState(){
        if(!this.state.selected) return null
        return this.idSubState(this.state.selected.value)
    }

    cloneToOption(value){
        let targetOption = this.findOptionByValue(value)
        if(!this.state.selected){
            window.alert("Nothing to clone.")
            return
        }
        let sourceOption = this.findOptionByValue(this.state.selected.value)        
        for(let key in sourceOption){
            if(!["value", "display"].includes(key)) targetOption[key] = sourceOption[key]
        }
        this.buildOptions()
        this.storeState()

        let path = this.path()

        for(let entry of Object.entries(localStorage)){
            let m = entry[0].match(new RegExp(`^${path}/${sourceOption.value}(.*)`))
            if(m){
                let storedOpt = localStorage.getItem(m[0])                             
                let targetPath = path + "/" + targetOption.value + m[1]                
                localStorage.setItem(targetPath, storedOpt)
            }
        }
        
        this.buildOptions()
        this.storeState()
    }

    init(){                        
        this.width                          = this.props.width || ( this.props.isContainer ? 500 : 300 )
        this.height                         = this.props.height || 20           

        this.textPadding                    = 2
        this.separationMargin               = 2
        this.containerPadding               = 2
        this.selectedPadding                = 2    
        this.selectedDivBackgroundColor     = "#ddd"
        this.selectedDivColor               = "#00f"
        this.selectedDivFontSize            = this.height * 0.9
        this.optionsDivBorderColor          = "#aaa"
        this.optionsDivBakcgroundColor      = "#ddd"        
        this.optionsDivZIndex               = 10 + ( this.props.forceZIndex ? this.props.forceZIndex : 0 )
        this.optionsDivBorderWidth          = this.height / 6
        this.optionsDivBorderStyle          = "solid"
        this.containerButtonMargin          = 2
        this.optionLabelFontSize            = this.selectedDivFontSize * 0.85
        this.optionLabelBorderStyle         = "solid"
        this.optionLabelBorderWidth         = 1
        this.optionLabelBorderColor         = "#aaa"
        this.optionLabelBorderRadius        = 5
        this.optionLabelBackgroundColor     = "#dfc"
        this.optionLabelMarginRight         = 2
        this.optionLabelPadding             = 2
        this.optionEnabledOpacity           = 1
        this.optionDisabledOpacity          = 0.5
        this.optionBackgroundColor          = "#eee"
        this.optionSelectedBackgroundColor  = "#7f7"
        this.dragOptionHighlightColor       = "#ff0"
        this.dragOptionOverColor            = "#0f0"
        this.dragBoxColor                   = "#00f"
        this.dragBoxSize                    = this.height * 0.7
        this.deleteButtonColor              = "#faa"
        this.editOptionButtonColor          = "#ddd"
        this.optionButtonFontSize           = this.height / 2
        this.optionElementDivFontSize       = this.height * 0.8
        this.optionButtonLeftMargin         = 2
        this.optionCheckBoxSize             = this.height * 0.8
        this.editDivZIndex                  = 20 + ( this.props.forceZIndex ? this.props.forceZIndex : 0 )
        this.widgetFontSize                 = this.height * 0.9
        this.widgetButtonFontSize           = this.widgetFontSize * 0.8
        this.widgetPadding                  = 2        
        this.optionEditDivBackgroundColor   = "#f00"
        this.optionEditDivPadding           = 2
        this.optionEditDivMargin           = -2        
        this.optionEditComboFontSize        = this.height * 0.75
        this.containerRolledBackgroundColor = "#77f"
        this.containerBackgroundColor       = "#eee"
        this.optionsDivTop                  = this.height + 2 * ( this.containerPadding + this.selectedPadding )        
        
        this.optionLabelWidth               = this.height * 9
        this.optionsLeftControlWidth        = 35 + this.height * 0.85
        this.optionsRightControlWidth       = 35 + this.height * 0.8
        this.optionControlsWidth            = this.optionsLeftControlWidth + this.optionsRightControlWidth

        this.optionsDivLeft                 = this.props.optionChild ? - ( this.optionLabelWidth + this.optionsLeftControlWidth ) : 0

        this.elementDivWidth                = this.width + this.optionLabelWidth

        this.optionEditDivWidth             = this.elementDivWidth - 2 * this.optionEditDivPadding
        
        this.optionsDivWidth                = this.elementDivWidth + this.optionControlsWidth
        
        this.widgetWidth                    = this.width * 0.96

        this.childEditableListWidth         = this.width * 0.8        

        this.selectedDiv = div().ww(this.width).hh(this.height).pad(this.selectedPadding)
            .ae("click", this.switchRoll.bind(this))
            .fwb().fs(this.selectedDivFontSize)
            .ovfh()
            .bc(this.selectedDivBackgroundColor).c(this.selectedDivColor)

        this.optionsDiv = div().poa().zi(this.optionsDivZIndex)            
            .ww(this.optionsDivWidth)
            .t(this.optionsDivTop).l(this.optionsDivLeft)
            .bdr(this.optionsDivBorderStyle, this.optionsDivBorderWidth, this.optionsDivBorderColor)
            .bc(this.optionsDivBakcgroundColor)
        
        this.container = div().por().dfc().pad(this.containerPadding)
        
        this.container.a(
            this.selectedDiv,
            Button(">", this.switchRoll.bind(this)).marl(this.containerButtonMargin),
            Button("+", this.addOption.bind(this)).marl(this.containerButtonMargin),            
            this.optionsDiv
        )
        
        this.ffm().ac("unselectable").dib()

        this.a(this.container)

        if(this.props.forceSelected) this.state.selected = this.props.forceSelected
        if(this.props.forceOptions) this.state.options = this.props.forceOptions

        this.build()
    }

    build(){
        this.buildOptions()

        this.state.rolled = !this.state.rolled
        this.switchRoll()
    }

    fromOrderedHash(oh){        
        this.state.options = oh.blob.map(entry => ({
            kind: "text",
            value: entry[0],
            display: entry[0]
        }))

        oh.blob.forEach(entry => {
            storeLocal(this.path() + "/" + entry[0], {text: entry[1]})
            storeLocal(this.path() + "/" + entry[0] + "#enable", {checked: true})
        })

        this.state.selected = null

        this.build()

        return this
    }

    optionClicked(option, oe){                
        if(oe.editOn) return
        this.state.selected = option
        this.state.rolled = (!this.props.isContainer) || this.props.forceRollOnSelect
        this.buildOptions()
        if(!this.props.dontRollOnSelect) this.switchRoll()

        if(this.props.changeCallback) this.props.changeCallback(this.state.selected, this.state.options)
    }

    delOption(option){
        this.state.options = this.state.options.filter(opt => opt.value != option.value)
        if(this.state.options.length) this.state.selected = this.state.options[0]
        else this.state.selected = null
        this.buildOptions()
        this.storeState()

        if(this.props.changeCallback) this.props.changeCallback(this.state.selected, this.state.options)
    }

    handleEvent(sev){        
        if(sev.do == "dragoption"){
            sev.stopPropagation = true            
            switch(sev.kind){
                case "dragstart":
                    this.draggedElement = sev.e
                    this.draggedOption = this.draggedElement.props.option
                    this.draggedElement.bc(this.dragOptionHighlightColor)
                    break
                case "dragover":
                    sev.ev.preventDefault()
                    sev.e.bc(this.dragOptionOverColor)
                    this.draggedElement.bc(this.dragOptionHighlightColor)
                    break
                case "dragleave":
                    sev.ev.preventDefault()
                    sev.e.bc(this.dragBoxColor)
                    this.draggedElement.bc(this.dragOptionHighlightColor)
                    break
                case "drop":                               
                    let dropOption = sev.e.props.option
                    let i = this.state.options.findIndex(opt => opt.value == this.draggedOption.value)
                    let j = this.state.options.findIndex(opt => opt.value == dropOption.value)                    
                    this.state.options.itoj(i,j)                    
                    this.buildOptions()
                    this.storeState()

                    if(this.props.changeCallback) this.props.changeCallback(this.state.selected, this.state.options)
                    break
            }
        }
    }

    buildOptions(){
        if(!this.state.options) this.state.options = []

        if((!this.state.selected) && this.state.options.length) this.state.selected = this.state.options[0]

        if(!this.state.options.length) this.state.selected = null
        
        this.optionsDiv.x().ame(this.state.options.map(option =>
            OptionElement({option: option})
        ))       

        if(this.props.isContainer && (!this.props.showSelected)){
            this.selectedDiv.html(this.props.label ? this.props.label : "")
        }else{
            if(this.state.selected){
                this.selectedDiv.html(this.state.selected.display)
            }else this.selectedDiv.x()
        }        
    }

    switchRoll(){        
        this.state.rolled = !this.state.rolled
        this.container.bc(this.state.rolled ? this.containerRolledBackgroundColor : this.containerBackgroundColor)
        this.optionsDiv.show(this.state.rolled)
        this.storeState()
    }

    findOptionByValue(value){
        return this.state.options.find(option => option.value == value)
    }

    addOption(){
        let value, display
        if(this.props.addOptionCallback){
            [ value, display ] = this.props.addOptionCallback()
        }else{
            value = window.prompt("Option Value :")
            if(!value) value = ""        
            display = ( this.props.useValueAsDisplay ? value : window.prompt("Option Display :") ) || value
        }        
        let opt = this.findOptionByValue(value)
        if(opt){
            opt.display = display
            this.state.selected = opt
            this.buildOptions()
            this.storeState()
            return
        }
        opt = {
            kind: this.props.isContainer ?
                this.props.forceCreateKind || "editablelist"
            :
                "scalar",
            value: value,
            display: display
        }        
        this.state.options.push(opt)
        this.state.selected = opt
        this.buildOptions()
        this.storeState()
        if(!this.state.rolled){
            this.switchRoll()
        }

        let path = this.path() + "/" + opt.value + "#enable"        
        storeLocal(path, {checked: true})
        this.buildOptions()

        if(this.props.changeCallback) this.props.changeCallback(this.state.selected, this.state.options)
    }
}
function EditableList(props){return new EditableList_(props)}

class Canvas_ extends SmartDomElement{
    constructor(props){
        super("canvas", props)

        this.ctx = this.getContext("2d")

        this.setWidth(props.width || 100).setHeight(props.height || 100)
    }

    // https://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
    getLines(text, maxWidth) {
        let words = text.split(" ")
        let lines = []
        let currentLine = words[0]
    
        for (let i = 1; i < words.length; i++) {
            var word = words[i]
            var width = this.ctx.measureText(currentLine + " " + word).width
            if (width < maxWidth) {
                currentLine += " " + word
            } else {
                lines.push(currentLine)
                currentLine = word
            }
        }

        lines.push(currentLine)

        return lines
    }

    renderText(text, maxwidth, lineheight, x, y){
        let lines = this.getLines(text, maxwidth)

        for(let i in lines){
            this.ctx.fillText(lines[i], x, y + i * lineheight)
        }
    }

    setFont(font){
        this.ctx.font = font
    }

    fillText(text, orig){
        this.ctx.fillText(text, orig.x, orig.y)
    }

    clearRect(orig, size){
        this.ctx.clearRect(orig.x, orig.y, size.x, size.y)
    }

    clear(){
        this.ctx.clearRect(0, 0, this.width, this.height)
    }

    getHeight(){
        return this.e.height
    }

    getWidth(){
        return this.e.width
    }

    strokeCircle(orig, r){
        this.ctx.beginPath()
        this.ctx.arc(orig.x, orig.y, r, 0, 2 * Math.PI, false)
        this.ctx.stroke()
    }

    arrow(from, to, argsopt){        
        let diff = to.m(from)
        let l = diff.l()
        let rot = Math.asin((to.y - from.y)/l)        
        if(to.x < from.x) rot = Math.PI - rot             
        let args = argsopt || {}        
        let scalefactor = getelse(args, "scalefactor", 1)
        let auxscalefactor = getelse(args, "auxscalefactor", 1)
        let linewidth = getelse(args, "linewidth", 16) * scalefactor * auxscalefactor
        let halflinewidth = linewidth / 2
        let pointheight = getelse(args, "pointheight", 40) * scalefactor * auxscalefactor
        let pointwidth = getelse(args, "pointwidth", 30) * scalefactor * auxscalefactor
        let halfpointwidth = pointwidth / 2
        let color = getelse(args, "color", "#ff0")        
        let opacity = getelse(args, "opacity", 1)        
        let lineheight = l - pointheight
        this.ctx.save()
        this.ctx.globalAlpha = opacity
        this.ctx.translate(from.x, from.y)
        this.ctx.rotate(rot)
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(0, halflinewidth)        
        this.ctx.lineTo(lineheight, halflinewidth)
        this.ctx.lineTo(lineheight, halflinewidth + halfpointwidth)
        this.ctx.lineTo(l, 0)
        this.ctx.lineTo(lineheight, - ( halflinewidth + halfpointwidth ) )
        this.ctx.lineTo(lineheight, - halflinewidth)
        this.ctx.lineTo(0, -halflinewidth)        
        this.ctx.lineTo(0, 0)        
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.restore()
    }

    fillStyle(fs){
        this.ctx.fillStyle = fs
    }

    strokeStyle(ss){
        this.ctx.strokeStyle = ss
    }

    lineWidth(lw){
        this.ctx.lineWidth = lw
    }

    fillRect(orig, size){
        this.ctx.fillRect(orig.x, orig.y, size.x, size.y)
    }

    setWidth(width){
        this.width = width
        this.sa("width", width)

        return this
    }

    setHeight(height){
        this.height = height
        this.sa("height", height)

        return this
    }

    getContext(context){
        return this.e.getContext(context)
    }

    toDataURL(kind){
        return this.e.toDataURL(kind)
    }

    downloadHref(name, kind){
        let dt = this.toDataURL('image/' + kind)
        dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream')
        dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=' + name + "." + kind)
        return dt
    }

    loadBackgroundImage(url, sizeOpt){return P(resolve => {
        let bimg = Img()
        bimg.ae("load", () => {
            let width = bimg.naturalWidth
            let height = bimg.naturalHeight
            if(sizeOpt){
                width = sizeOpt.x
                bimg.width(width)
                height = sizeOpt.y
                bimg.height(height)
            }
            let mulx = Math.floor(this.width / width) + 1
            let muly = Math.floor(this.height / height) + 1                
            for(let x = 0; x < mulx; x++) for(let y = 0; y < muly; y++){
                this.ctx.drawImage(bimg.e, x * width, y * height, width, height)
            }
            resolve(true)
        })
        bimg.src = url
    })}

    drawImageFromSrc(src, orig, sizeOpt){return P(resolve => {
        let img = Img()
        img.ae("load", () => {         
            let size = sizeOpt || Vect(img.naturalWidth, img.naturalHeight)       
            this.ctx.drawImage(img.e, orig.x, orig.y, size.x, size.y)

            resolve(true)
        })
        img.src = src
    })}
}
function Canvas(props){return new Canvas_(props)}

class Img_ extends SmartDomElement{
    constructor(propsOpt){
        super("img", propsOpt)

        this.props = propsOpt || {}

        this.width(this.props.width || 100).height(this.props.height || 100)

        if(this.props.src){
            this.src = this.props.src
        }
    }

    width(width){
        this.sa("width", width)
        return this
    }

    height(height){
        this.sa("height", height)
        return this
    }

    set src(src){
        this.e.src = src        
    }

    get naturalWidth(){return this.e.naturalWidth}
    get naturalHeight(){return this.e.naturalHeight}
}
function Img(props){return new Img_(props)}

class SplitPane_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.width = this.props.width || 600
        this.height = this.props.height || 400
        this.headsize = this.props.headsize || 36

        this.headDiv = div().dfca().bc(this.props.fitViewPort ? "#fff" : "#ddd")        
        this.bodyDiv = div().bc(this.props.fitViewPort ? "#fff" : "#ffe")

        this.dfc()

        if(this.props.row){            
            this.headDiv.fd("column")
        }else{
            this.fd("column")
        }

        this.a(this.headDiv, this.bodyDiv)

        if(this.props.fitViewPort){
            window.addEventListener("resize", this.resize.bind(this))
        }

        this.resize()
    }

    resize(widthOpt, heightOpt){
        this.width = widthOpt || this.width
        this.height = heightOpt || this.height

        if(this.props.fitViewPort){
            this.width = window.innerWidth
            this.height = window.innerHeight
            document.body.style.padding = "0px"
            document.body.style.margin = "0px"
        }

        if(this.props.row){
            this.bodysize = this.width - this.headsize
            this.headDiv.w(this.headsize).h(this.height)
            this.bodyWidth = this.bodysize
            this.bodyHeight = this.height            
        }else{
            this.bodysize = this.height - this.headsize
            this.headDiv.w(this.width).h(this.headsize)
            this.bodyWidth = this.width
            this.bodyHeight = this.bodysize
        }

        this.bodyDiv.ww(this.bodyWidth).hh(this.bodyHeight)

        if(this.content) this.resizeContent()

        try{            
            this.resizeTask() 
        }catch(err){err}
    }

    resizeContent(){
        try{
            this.content.resize(this.bodyWidth, this.bodyHeight)
        }catch(err){}        
    }

    setContent(content){
        this.content = content
        this.bodyDiv.x().a(content)
        this.resizeContent()
    }
}
function SplitPane(props){return new SplitPane_(props)}

class Tab_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.height = this.props.height || 30

        this.content = this.props.content || div()

        this.dib().cp().pad(3).ae("click", this.clicked.bind(this))
    }

    clicked(){
        this.idParent().setSelected(this)
    }

    selected(selected){
        this.isSelected = selected
        return this.build()        
    }

    build(){
        this.x()
        .bc(this.isSelected ?
            this.props.selBackgroundColor || "#fff"
        :
            this.props.backgroundColor || "#ccc"
        )
        .a(div().dfc().a(
            div().html(this.props.caption).marl(3),
            div().fwb().marl(3).html(this.props.alert ? this.props.alert : "").c("#00f"),
        ))
        return this
    }

    setCaption(caption){
        this.props.caption = caption
        return this.build()
    }

    setAlert(alert){
        this.props.alert = alert
        return this.build()
    }
}
function Tab(props){return new Tab_(props)}

const SKIP_BODY = true

class TabPane_ extends SplitPane_{
    constructor(props){
        super(props)

        this.tabs = []
    }

    resizeTask(){                
        this.build()
    }

    setTabs(tabs){
        this.tabs = tabs        
        return this.build()
    }

    build(skipBody){
        this.headDiv.x().a(this.tabs.map(tab => tab.selected(tab == this.selected)))                
        if(!this.props.headSelectable) this.headDiv.ac("unselectable")
        this.bodyDiv.ovf("initial")        
        if(!skipBody) this.bodyDiv.x().a(this.tabs.map(tab => {                        
            return tab.content.show(tab == this.selected)
        }))        
        if(this.selected){            
            if(
                (!(this.selected.content instanceof TabPane_))
                &&
                (!(this.selected.content.noScroll))
            )
                this.bodyDiv.ovf("scroll")
            try{                                
                this.selected.content.resize(this.bodyWidth, this.bodyHeight)                
            }catch(err){}            
        }
        return this
    }

    setSelected(tab){
        this.selected = tab        
        if(this.selected){            
            this.state.selected = this.selected.id
            for(let tab of this.tabs) tab.content.show(tab == this.selected)
            this.storeState()            
        }                
        this.build(SKIP_BODY)        
        this.bodyDiv.e.scrollLeft = 0
        return this
    }

    selectTab(key){
        this.setSelected(this.findTabById(key))
    }

    findTabById(id){
        return this.tabs.find(tab => tab.id == id)
    }

    init(){                
        if(this.tabs.length) this.selected = this.tabs[0]
        if(this.state.selected) this.selected = this.findTabById(this.state.selected) || this.selected                
        this.build()
    }
}
function TabPane(props){return new TabPane_(props)}

class table_ extends SmartDomElement{
    constructor(props){
        super("table", props)
    }
}
function table(props){return new table_(props)}

class tr_ extends SmartDomElement{
    constructor(props){
        super("tr", props)
    }
}
function tr(props){return new tr_(props)}

class thead_ extends SmartDomElement{
    constructor(props){
        super("thead", props)
    }
}
function thead(props){return new thead_(props)}

class th_ extends SmartDomElement{
    constructor(props){
        super("th", props)
    }
}
function th(props){return new th_(props)}

class tbody_ extends SmartDomElement{
    constructor(props){
        super("tbody", props)
    }
}
function tbody(props){return new tbody_(props)}

class td_ extends SmartDomElement{
    constructor(props){
        super("td", props)
    }
}
function td(props){return new td_(props)}

class FormTable_ extends SmartDomElement{
    constructor(props){
        super("table", props)

        this
            .sa("cellpadding", this.props.cellPadding || 3)
            .sa("cellspacing", this.props.cellSpacing || 3)
            .bc(this.props.backgroundColor || "#eee")
            .ffm().mar(3)
            .a(
            thead().a(tr().a(
                th().html(this.props.optionNameHeader || "Option Name"),
                th().html(this.props.optionValueHeader || "Option Value")
            )),
            tbody().a(
                (this.props.options || []).map(option=>
                    tr().a(
                        td().html(option.props.display || option.id),
                        td().a(option)
                    )
                )
            )
        )
    }
}
function FormTable(props){return new FormTable_(props)}

class RenderPages_ extends SmartDomElement{
    constructor(props){
        super("div", props)
        this.list = this.props.list || []
        this.headWidth = this.props.headWidth || 600
        this.bodyWidth = this.props.bodyWidth || 2000
        this.chunkSize = this.props.chunkSize || 500
        this.bodyHeight = this.props.bodyHeight
        this.lastRenderedPage = 0
        this.lastRenderedLength = 0
        this.lastScrollTop = 0
        this.renderItem = this.props.renderItem || ((_, i) => div().html("item " + i))
        this.sortItems = this.props.sortItems || null
        this.pagesDiv = div().ac("unselectable").mar(2).maw(this.headWidth)
        this.bodyDiv = div().w(this.bodyWidth).ovfs()
        if(this.bodyHeight) this.bodyDiv.mah(this.bodyHeight)
        this.bodyDiv.ae("scroll", this.bodyDivScrolled.bind(this))
        this.a(
            this.pagesDiv,
            this.bodyDiv
        )
    }

    bodyDivScrolled(){
        this.lastScrollTop = this.bodyDiv.e.scrollTop        
    }

    renderHeader(page){
        this.pagesDiv.x()
        if(!this.list.length) return
        let maxPages = this.list.length / this.chunkSize
        let maxPagesFloor = Math.floor(maxPages)
        for(let page = 0; page < ( maxPagesFloor + (maxPages != maxPagesFloor ? 1 : 0) ); page++){
            this.pagesDiv.a(
                div().dib().mar(2).marr(10).c("#00f")
                    .bc(page == this.lastRenderedPage ? "#afa" : "#eee")
                    .html(`${page * this.chunkSize + 1} - ${Math.min((page + 1) * this.chunkSize, this.list.length)}`)
                    .cp().ae("mousedown", this.render.bind(this, page))
            )
        }
    }

    renderBody(page){        
        let i = page * this.chunkSize
        this.bodyDiv.x().a(            
            this.list.slice(page * this.chunkSize, Math.min((page + 1) * this.chunkSize), this.list.length)
                .map(item => this.renderItem(item, i++))
        )
    }

    render(page, force){        
        if(!force) if( (this.list.length == this.lastRenderedLength) && (page == this.lastRenderedPage) ) return this                
        if(this.sortItems) this.list.sort(this.sortItems)
        this.lastRenderedLength = this.list.length
        this.lastScrollTop = page == this.lastRenderedPage ? this.lastScrollTop : 0
        this.lastRenderedPage = page
        this.renderHeader(page)
        this.renderBody(page)        
        setTimeout(() =>        
            this.bodyDiv.e.scrollTop = this.lastScrollTop,
            0
        )
        return this
    }

    refresh(page){
        return this.render(page, true)
    }
}
function RenderPages(props){return new RenderPages_(props)}

class Labeled_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.dib().marl(3).a(            
            div().dfc().a(
                div().html(this.props.label).marr(3).fs(this.props.fs || 12),
                this.props.element
            )
        )
    }
}
function Labeled(label, element, props){return new Labeled_({...{label: label, element: element},  ...props})}

class LogItem_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this
            .ac("logitem")
            .build()
    }

    build(){
        this.acs(this.props.cls || "normal")

        if(this.props.text) this.a(div().ac("text").html(this.props.text))
        if(this.props.pre) this.a(div().ac("pre").html("<pre>" + this.props.pre + "</pre>"))
        if(this.props.json) this.a(div().ac("json").html(md2html("```json\n" + JSON.stringify(this.props.json, null, 2) + "\n```")))
    }
}
function LogItem(props){return new LogItem_(props)}

class Logger_ extends SmartDomElement{
    constructor(props){
        super("div", props)

        this.capacity = this.props.capacity || 20

        this.items = []

        this.build()
    }

    log(item){
        this.items.unshift(item)
        while(this.items.length > this.capacity) this.items.pop()
        this.build()
    }

    build(){
        this.x().a(this.items)
    }
}
function Logger(props){return new Logger_(props)}

class a_ extends SmartDomElement{
    constructor(props){
        super("a", props)
    }

    href(href){
        this.sa("href", href)
        return this
    }

    download(download){
        this.sa("download", download)
        return this
    }
}
function a(props){return new a_(props)}

class ThreeAssemblyItem{
    constructor(object, delta){
        this.object = object
        this.delta = delta || new THREE.Vector3(0, 0, 0)
    }
}

class ThreeAssembly{
    constructor(){
        this.origo = new THREE.Vector3(0, 0, 0)
        this.items = []
    }

    rotateOnAxis(v3, angle){
        for(let item of this.items){
            item.object.rotateOnAxis(v3, angle)
        }
        return this
    }

    applyAxisAngle(v3, angle){
        for(let item of this.items){
            item.delta.applyAxisAngle(v3, angle)
        }
        return this.calculate()
    }

    calculate(){
        for(let item of this.items){
            let pv = this.origo.clone().add(item.delta)
            item.object.position.x = pv.x
            item.object.position.y = pv.y
            item.object.position.z = pv.z
        }
        return this
    }

    setOrigo(o){
        this.origo = o
        return this.calculate()
    }

    add(item){
        this.items.push(item)
        return this
    }

    addToScene(scene){
        for(let item of this.items){
            scene.add(item.object)
        }
    }

    removeFromScene(scene){
        for(let item of this.items){
            scene.remove(item.object)
        }
    }
}

class ThreeRenderer_ extends SmartDomElement{
    render(){
        this.renderer.render(this.scene, this.camera)
    }

    getGroup(name){
        if(!this.groups) this.groups = {}
        if(!this.groups[name]) this.groups[name] = []
        return this.groups[name]
    }

    addToGroup(name, tha){
        this.getGroup(name)
        this.groups[name].push(tha)
        if(tha instanceof ThreeAssembly) tha.addToScene(this.scene)
        else this.scene.add(tha)
    }

    clearGroup(name){
        this.getGroup(name)
        this.groups[name] = []
    }

    removeGroup(name){        
        for(let tha of this.getGroup(name)){
            if(tha instanceof ThreeAssembly) tha.removeFromScene(this.scene)
            else this.scene.remove(tha)
        }
        this.clearGroup(name)
    }

    constructor(props){
        super("div", props)

        this.RENDERER_WIDTH     = this.props.RENDERER_WIDTH     || 600
        this.RENDERER_HEIGHT    = this.props.RENDERER_HEIGHT    || 400        
        this.FIELD_OF_VIEW      = this.props.FIELD_OF_VIEW      || 75
        this.NEAR_CLIPPING_PANE = this.props.NEAR_CLIPPING_PANE || 0.1
        this.FAR_CLIPPING_PANE  = this.props.FAR_CLIPPING_PANE  || 1000

        this.ASPECT_RATIO       = this.RENDERER_WIDTH / this.RENDERER_HEIGHT

        this.scene = new THREE.Scene()

        this.ambientLight = new THREE.AmbientLight( this.props.AMBIENT_LIGHT_COLOR || 0x555555 )
        this.scene.add(this.ambientLight)

        this.spotLight = new THREE.SpotLight( this.props.SPOT_LIGHT_COLOR || 0xffffff )
        this.spotLight.position.set(
            this.props.SPOTLIGHT_X || 50,
            this.props.SPOTLIGHT_Y || 100,
            this.props.SPOTLOGHT_Z || 50
        )

        this.spotLight.castShadow = (typeof this.props.SPOTLIGHT_CAST_SHADOW != "undefined") ?
            this.props.SPOTLIGHT_CAST_SHADOW : true

        this.spotLight.shadow.mapSize.width   = this.props.SPOTLIGHT_SHADOW_MAP_WIDTH     || 1024
        this.spotLight.shadow.mapSize.height  = this.props.SPOTLIGHT_SHADOW_MAP_HEIGHT    || 1024

        this.spotLight.shadow.camera.near = this.props.SPOTLIGHT_SHADOW_CAMERA_NEAR   || 500
        this.spotLight.shadow.camera.far  = this.props.SPOTLIGHT_SHADOW_CAMERA_FAR    || 4000
        this.spotLight.shadow.camera.fov  = this.props.SPOTLIGHT_SHADOW_CAMERA_FOV    || 30

        this.scene.add(this.spotLight)

        this.camera = new THREE.PerspectiveCamera(
            this.FIELD_OF_VIEW,
            this.ASPECT_RATIO,
            this.NEAR_CLIPPING_PANE,
            this.FAR_CLIPPING_PANE
        )

        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setSize(this.RENDERER_WIDTH, this.RENDERER_HEIGHT)

        this.e.appendChild(this.renderer.domElement)
    }
}
function ThreeRenderer(props){return new ThreeRenderer_(props)}

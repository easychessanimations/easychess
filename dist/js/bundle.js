(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/* eslint-env browser */
module.exports = typeof self == 'object' ? self.FormData : window.FormData;

},{}],3:[function(require,module,exports){
(function (global){
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":5}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
const utils = require('./utils')

const SUPPORTED_VARIANTS = [
    ["standard", "Standard"],
    ["atomic", "Atomic"]
]

const SUPPORTED_PERFS = [
    ["bullet", "Bullet"],
    ["blitz", "Blitz"],
    ["atomic", "Atomic"]
]

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

function promotionKindsForVariant(variant){    
    return STANDARD_PROMOTION_KINDS
}

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
    [ "threeCheck", "Three-check", THREE_CHECK_START_FEN ]
]

const INCLUDE_LIMITS = true

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
    movetoalgeb(move){return `${this.squaretoalgeb(move.fromsq)}${this.squaretoalgeb(move.tosq)}${move.prompiece ? move.prompiece.kind : ''}`}

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

        this.fen = state.fen
    }

    pop(){
        this.setstate(this.stack.pop())
    }

    algebtomove(algeb){
        let lms = this.legalmovesforallpieces()

        return lms.find((move) => this.movetoalgeb(move) == algeb)
    }

    pushalgeb(algeb){
        let move = this.algebtomove(algeb)

        if(!move) return false

        this.push(move)

        return true
    }

    push(move){                
        this.pushstate()

        let fromp = this.pieceatsquare(move.fromsq)

        // set squares

        let top = this.pieceatsquare(move.tosq)        
        this.setpieaceatsquare(move.fromsq, Piece())
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

        this.fen = this.rawfen + " " + this.turnfen + " " + this.castlefen + " " + this.epfen + " " + this.halfmovefen + " " + this.fullmovefen
    }

    squareok(sq){
        return ( sq.file >= 0 ) && ( sq.rank >= 0 ) && ( sq.file < NUM_SQUARES ) && ( sq.rank < NUM_SQUARES)
    }

    promkinds(){
        if(this.variant == "antichess") return ["q", "r", "b", "n", "k"]
        return ["q", "r", "b", "n"]
    }

    pseudolegalmovesforpieceatsquare(p, sq){                        
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
            let move = Move(this.whereisking(this.turn), this.castletargetsq(side, this.turn))
            move.castling = true
            move.san = side == "k" ? "O-O" : "O-O-O"
            move.delrooksq = this.rookorigsq(side, this.turn)
            move.putrooksq = this.rooktargetsq(side, this.turn)
            lms.push(move)
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

        if(fromp.kind == "p"){
            return capt ? fromalgeb[0] + "x" + toalgeb + prom + check : toalgeb + prom + check
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
        return capt ? letter + qualifier + "x" + toalgeb + check : letter + qualifier + toalgeb + prom + check
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

    movewithnumber(node, force, docomments){
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
        return `${((fenparts[1] == "b")||force)?number + " ":""}${node.gensan}${comments}`
    }

    line(docomments, nodeOpt){
        let current = nodeOpt || this.getcurrentnode()
        let nodes = []
        while(current){
            nodes.unshift(current)
            current = current.getparent()
        }
        nodes.shift()
        let first = true        
        return nodes.map((node)=>{            
            let mn = this.movewithnumber(node, first, docomments)
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
        params.buff += this.movewithnumber(mainChild, params.variationStart, params.docomments)

        if(childs.length > 1){            
            for(let child of childs.slice(1)){
                params.buff += " ( "                            
                params.buff += this.movewithnumber(child, true, params.docomments)
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
            buff: params.buff
        })
    }

    reportPgnHeaders(rootNode){
        this.pgnHeaders.setKey("FEN", rootNode ? rootNode.fen : this.getrootnode().fen)
        let buff = this.pgnHeaders.blob.map(entry => `[${entry[0]} "${entry[1]}"]`).join("\n")
        this.pgnHeaders.setKey("FEN", this.getrootnode().fen)
        return buff
    }

    pgn(docomments, rootNodeOpt, domulti, keepBaseLine){
        let rootNode = rootNodeOpt || this.getrootnode()

        return `${this.reportPgnHeaders(keepBaseLine ? this.getrootnode() : rootNode)}\n\n${domulti ? this.multiPGN({
            docomments: docomments,
            rootNode: rootNode,
            variationStart: (!keepBaseLine) || (rootNode.id == "root"),
            buff: keepBaseLine ? this.line(!DO_COMMENTS, rootNode) : ""
        }) : this.line(docomments)}`
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
      if(VERBOSE) console.log("play", initialFen, moves, variant, timecontrol, moveOverHead)
      return utils.P(resolve => {
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
    this.issuecommand(`position fen ${this.analyzedfen}${this.moves ? " moves " + this.moves.join(" ") : ""}`)
    
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

module.exports.ChessBoard = ChessBoard
module.exports.AbstractEngine = AbstractEngine
module.exports.DEFAULT_MOVE_OVERHEAD = DEFAULT_MOVE_OVERHEAD
module.exports.WHITE = WHITE
module.exports.BLACK = BLACK

},{"./utils":10}],7:[function(require,module,exports){
(function (process){
const { LichessBot } = require('./lichessbot')
const utils = require('./utils')

let props = utils.GET_PROPS()
console.log(props)

let token = props.BOT_TOKEN

if(props.USER) if(props.USER.accessToken) token = props.USER.accessToken

let variant = "atomic"

if(props.ACCEPT_VARIANT) variant = props.ACCEPT_VARIANT

if(typeof process.env.BOT_VARIANT != "undefined") variant = process.env.BOT_VARIANT

let b = LichessBot({
    token: token,
    acceptVariant: variant,
    useBotBook: true
})

console.log("created", b)

b.stream()
}).call(this,require('_process'))
},{"./lichessbot":9,"./utils":10,"_process":5}],8:[function(require,module,exports){
const utils = require('./utils')
const FormData = require('form-data')

const P = utils.P
const simpleFetch = utils.simpleFetch

const LICHESS_LOGIN_URL             = "/auth/lichess"
const LICHESS_BASE_URL              = "https://lichess.org"
const LICHESS_ANALYSIS_URL          = LICHESS_BASE_URL + "/analysis"
const LICHESS_GAMES_URL             = LICHESS_BASE_URL + "/api/games/user"
const LICHESS_LEADERBOARD_URL       = LICHESS_BASE_URL + "/player/top"
const LICHESS_USERS_URL             = LICHESS_BASE_URL + "/api/users"
const LICHESS_USER_URL              = LICHESS_BASE_URL + "/api/user"
const LICHESS_MAX_LEADERBOARD_NB    = 200
const LICHESS_MAX_USER_IDS          = 300

function lichessAnalysisUrl(fenOpt, variantOpt){
    let fen = fenOpt || STANDARD_START_FEN
    let variant = variantOpt || DEFAULT_VARIANT

    return `${LICHESS_ANALYSIS_URL}/${variant}/${fen}`
}

function lichessGamesUrl(username, optsOpt){
    let opts = optsOpt || {}

    return `${LICHESS_GAMES_URL}/${username}?${Object.entries(opts).map(opt => opt[0] + "=" + opt[1]).join("&")}`
}

function lichessGameUrl(gameId){
    return LICHESS_BASE_URL + "/" + gameId
}

function getLichessLeaderBoard(perfOpt, nbOpt){
    let perf = perfOpt || DEFAULT_PERF
    let nb = nbOpt || LICHESS_MAX_LEADERBOARD_NB

    return P(resolve => {
        simpleFetch(`${LICHESS_LEADERBOARD_URL}/${nb}/${perf}`,
        {
            asVndLichessV3Json: true,
            server: true
        }, result => {                
            if(result.ok){
                resolve(result.users)
            }
        })
    })
}

function fetchLichessUsers(userIds){
    return P(resolve => {
        simpleFetch(LICHESS_USERS_URL, {
            method: "POST",
            body: userIds.slice(0, Math.min(LICHESS_MAX_USER_IDS, userIds.length)).join(","),
            asJson: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function getLichessUserFollow(userId, kindOpt){
    let kind = kindOpt || "following"
    return P(resolve => {
        simpleFetch(`${LICHESS_USER_URL}/${userId}/${kind}`, {
            asNdjson: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function getLichessGames(username, optsOpt, accessTokenOpt){
    let url = lichessGamesUrl(username, optsOpt)

    return P(resolve => {
        simpleFetch(url, {
            asNdjson: true,
            accessToken : accessTokenOpt
        }, result => resolve(result))
    })
}

const LICHESS_BOOK_URL              = "https://explorer.lichess.ovh/lichess"

const LICHESS_BOOK_MAX_MOVES        = 12
const LICHESS_BOOK_AVG_RATINGS      = [ 1600, 1800, 2000, 2200, 2500 ]
const LICHESS_BOOK_TIME_CONTROLS    = [ "bullet", "blitz", "rapid", "classical" ]

function requestLichessBook(fenOpt, variantOpt, maxMovesOpt, ratingListOpt, speedListOpt){
    let fen = fenOpt || STANDARD_START_FEN
    let variant = variantOpt || DEFAULT_VARIANT
    let maxMoves = maxMovesOpt || LICHESS_BOOK_MAX_MOVES
    let ratingList = ratingListOpt || LICHESS_BOOK_AVG_RATINGS
    let speedList = speedListOpt || LICHESS_BOOK_TIME_CONTROLS

    let ratings = ratingList.map(opt => `ratings%5B%5D=${opt}`).join("&")

    let speeds = speedList.map(opt => `speeds%5B%5D=${opt}`).join("&")

    let url = LICHESS_BOOK_URL +`?fen=${fen}&moves=${maxMoves}&variant=${variant}`

    if(ratings) url += "&" + ratings

    if(speeds) url += "&" + speeds

    return P(resolve => {
        simpleFetch(url, {
            asJson: true
        }, result => {
            if(result.ok){                
                result.content.fen = fen
                resolve(result.content)
            }
        })
    })    
}

const AI_LEVEL_2_RATING = {
    1: 1350,
    2: 1420,
    3: 1500,
    4: 1600,
    5: 1700,
    6: 1900,
    7: 2200,
    8: 2600
  }
  
function ailevel2rating(ailevel){  
let rating = AI_LEVEL_2_RATING[ailevel]
if(!rating) return 1500
return rating
}

class LichessGame_{

    constructor(obj, myUsername){

        this.orig = obj

        this.id = obj.id

        this.positions = obj.positions

        this.createdAt = obj.createdAt

        this.moves = []
        if(obj.moves) this.moves = obj.moves.split(" ")

        if(!obj.players.white) obj.players.white = {}
        if(!obj.players.black) obj.players.black = {}

        this.whiteAILevel = obj.players.white.aiLevel || 0
        this.blackAILevel = obj.players.black.aiLevel || 0

        if(!obj.players.white.user) obj.players.white.user = {
            id: "none",
            name: `Stockfish AI level ${this.whiteAILevel}`,
            rating: ailevel2rating(this.whiteAILevel)
        }

        if(!obj.players.black.user) obj.players.black.user = {
            id: "none",
            name: `Stockfish AI level ${this.blackAILevel}`,
            rating: ailevel2rating(this.blackAILevel)
        }

        this.myUsername = myUsername

        this.whiteName = obj.players.white.user.name
        this.blackName = obj.players.black.user.name

        this.meWhite = this.myUsername.toLowerCase() == this.whiteName.toLowerCase()
        this.meBlack = this.myUsername.toLowerCase() == this.blackName.toLowerCase()

        this.hasMe = this.meWhite || this.meBlack

        this.myColor = "none"
        if(this.meWhite) this.myColor = "white"
        if(this.meBlack) this.myColor = "black"

        this.opponentName = this.meWhite ? this.blackName : this.whiteName
        
        this.whiteTitle = obj.players.white.user.title || ""
        this.blackTitle = obj.players.black.user.title || ""

        this.whiteBot = this.whiteTitle == "BOT"
        this.blackBot = this.blackTitle == "BOT"

        this.oppKind = "human"

        if(this.meWhite && this.blackBot) this.oppKind = "bot"
        if(this.meBlack && this.whiteBot) this.oppKind = "bot"

        this.someBot = this.whiteBot || this.blackBot

        this.whiteTitledName = this.whiteTitle == "" ? this.whiteName : this.whiteTitle + " " + this.whiteName
        this.blackTitledName = this.blackTitle == "" ? this.blackName : this.blackTitle + " " + this.blackName

        this.opponentTitledName = this.meWhite ? this.blackTitledName : this.whiteTitledName

        this.whiteRating = obj.players.white.rating
        this.blackRating = obj.players.black.rating

        if(obj.clock){
            this.clockInitial = obj.clock.initial
            this.clockIncrement = obj.clock.increment
            this.clockStr = `${this.clockInitial} + ${this.clockIncrement}`
        }else{
            this.clockInitial = "?"
            this.clockIncrement = "?"
            this.clockStr = `?`
        }        

        this.winner = obj.winner

        this.result = 0.5
        this.resultStr = "1/2 - 1/2"        
        this.myResult = 0.5        

        if(this.winner){            
            if(this.winner == "white"){
                this.result = 1
                this.resultStr = "1-0"
                this.myResult = this.myUsername.toLowerCase() == this.whiteName.toLowerCase() ? 1 : 0
            }else{
                this.result = 0
                this.resultStr = "0-1"
                this.myResult = this.myUsername.toLowerCase() == this.blackName.toLowerCase() ? 1 : 0
            }
        }                

        this.perf = obj.perf        
        this.variant = obj.variant || "?"
        
        if(this.perf == "correspondence"){
            this.perf = this.perf + " " + this.variant
            if(obj.daysPerTurn){
                this.clockStr = obj.daysPerTurn + " day(s)"
            }
        }

        this.whiteTitled = ( this.whiteTitle != "" ) && ( !this.whiteBot )
        this.blackTitled = ( this.blackTitle != "" ) && ( !this.blackBot )
        this.someTitled = ( this.whiteTitled || this.blackTitled )
        this.opponentTitle = this.meWhite ? this.blackTitle : this.whiteTitle
        this.opponentTitled = ( ( this.meWhite && this.BlackTitled ) || ( this.meBlack && this.whiteTitled ) )

        this.meWon = ( this.myResult == 1 )
        this.meLost = ( this.myResult == 0 )
        this.draw = ( this.result == 0.5 )

        this.rated = obj.rated        

        this.whiteHuman = (!this.whiteBot) && (!this.whiteAILevel)
        this.blackHuman = (!this.blackBot) && (!this.blackAILevel)        
        this.bothHuman = this.whiteHuman && this.blackHuman

        this.humanRated = this.bothHuman && this.rated

        this.myRating = undefined
        if(this.meWhite) this.myRating = this.whiteRating
        if(this.meBlack) this.myRating = this.blackRating

        this.opponentRating = undefined
        if(this.meWhite) this.opponentRating = this.blackRating
        if(this.meBlack) this.opponentRating = this.whiteRating

        this.ratingDiff = undefined
        if(this.myRating && this.opponentRating) this.ratingDiff = this.myRating - this.opponentRating

        this.plies = 0
        try{
        this.plies = obj.moves.split(" ").length
        }catch(err){console.log(err)}

        if(this.ratingDiff){
            this.effRatingDiff = this.ratingDiff
            if(this.meBlack) this.effRatingDiff -= 200

            this.surpriseDraw = false

            if((this.effRatingDiff > 0) && (this.result == 0.5)) this.surpriseDraw = true
        }

        for(let variant of SUPPORTED_VARIANTS.map(entry => entry[0])){
            ["White", "Black"].forEach(color =>
                this[`${variant}HumanRated${color}`] = rating =>
                    ( this.orig.variant == variant ) &&
                    ( this.oppKind == "human" ) &&
                    this.rated &&
                    this.opponentRating &&
                    ( this.opponentRating >= rating ) &&
                    this[`me${color}`]
            )

            this[`${variant}HumanRatedSince`] = date =>
                ( this.orig.variant == variant ) &&
                ( this.oppKind == "human" ) &&
                ( this.createdAt >= new Date(date).getTime() ) &&
                this.rated
        }
    }

    get summary(){
        return `${this.whiteTitledName} ( ${this.whiteRating} ) - ${this.blackTitledName} ( ${this.blackRating} ) [ ${this.perf} ${this.clockStr} ] ${this.resultStr}`
    }

    get summarypadded(){        
        return `${this.meLost ? "( * )" : this.surpriseDraw ? "( ? )" : "_____"} ${this.whiteTitledName.padEnd(20, "_")} ( ${this.whiteRating} ) - ${this.blackTitledName.padEnd(20, "_")} ( ${this.blackRating} ) ${this.resultStr.padEnd(9, "_")} [ ${this.clockStr.padEnd(10, "_")} ${this.perf.padEnd(12, "_")} ]`
    }

}
function LichessGame(obj, myUsername){return new LichessGame_(obj, myUsername)}

const LICH_API_GAMES_EXPORT = "api/games/user"

function lichapiget(path, headers, token, callback, errcallback){

    args = {...{
        method: "GET"
    }, headers}

    if ( token ){
        args.headers.Authorization= `Bearer ${token}`
    }

    let fullpath = "https://lichess.org/" + path

    fetch(fullpath, args).then(
        (response) => response.text().then(
            (content) => callback(content),
            (err) => errcallback(err)
        ),
        err => errcallback(err)
    )

}

function processgames(user, callback, content){        
    try{        
        let games = content.split("\n").filter((x)=>x.length > 0).map((x)=>LichessGame(JSON.parse(x), user))
        callback(games)
    }catch(err){console.log(content, err)}
}

function getlichessgames(user, token, max, callback){
    lichapiget(LICH_API_GAMES_EXPORT + `/${user}?max=${max}`, {Accept: "application/x-ndjson"}, token, processgames.bind(null, user, callback), processgames)
}

/////////////////////////////////////////////////
// bot

const LICHESS_BOT_LOGIN_URL             = "/auth/lichess/bot"
const LICHESS_BOT_UPGRAGE_URL           = LICHESS_BASE_URL + "/api/bot/account/upgrade"
const LICHESS_STREAM_EVENTS_URL         = LICHESS_BASE_URL + "/api/stream/event"
const LICHESS_CHALLENGE_URL             = LICHESS_BASE_URL + "/api/challenge"
const LICHESS_STREAM_GAME_STATE_URL     = LICHESS_BASE_URL + "/api/bot/game/stream"
const LICHESS_BOT_GAME_URL              = LICHESS_BASE_URL + "/api/bot/game"

function upgradeLichessBot(accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_BOT_UPGRAGE_URL, {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            server: true,
            asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function acceptLichessChallenge(challengeId, accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_CHALLENGE_URL + "/" + challengeId + "/accept", {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function declineLichessChallenge(challengeId, accessToken){
    return P(resolve => {
        simpleFetch(LICHESS_CHALLENGE_URL + "/" + challengeId + "/decline", {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function makeLichessBotMove(gameId, algeb, offeringDraw, accessToken){
    return P(resolve => {
        let offeringDrawQuery = offeringDraw ? "?offeringDraw=true" : ""
        simpleFetch(LICHESS_BOT_GAME_URL + "/" + gameId + "/move/" + algeb + offeringDrawQuery, {
            method: "POST",
            body: "",
            accessToken : accessToken,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function writeLichessBotChat(gameId, room, text, accessToken){    
    return P(resolve => {
        let formData = new FormData()
        formData.append("room", room)
        formData.append("text", text)
        simpleFetch(LICHESS_BOT_GAME_URL + "/" + gameId + "/chat", {
            method: "POST",
            body: `room=${room}&text=${text}`,
            accessToken : accessToken,
            asForm: true,
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

function abortLichessGame(gameId, accessToken){    
    return P(resolve => {        
        simpleFetch(LICHESS_BOT_GAME_URL + "/" + gameId + "/abort", {
            method: "POST",
            body: ``,
            accessToken : accessToken,            
            asJson: true,
            //server: true,
            //asContent: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

const LICHESS_TOURNAMENT_PAGE       = "https://lichess.org/tournament"
const LICHESS_API_TOURNAMENT_PAGE   = "https://lichess.org/api/tournament"

function getLichessTourneys(){
    return P(resolve =>{
        utils.simpleFetch(LICHESS_API_TOURNAMENT_PAGE, {
            asNdjson: true
        }, result => {
            if(result.ok){
                resolve(result.content)
            }
        })
    })
}

module.exports = {
    LICHESS_STREAM_EVENTS_URL: LICHESS_STREAM_EVENTS_URL,
    LICHESS_STREAM_GAME_STATE_URL: LICHESS_STREAM_GAME_STATE_URL,
    LICHESS_BOOK_MAX_MOVES: LICHESS_BOOK_MAX_MOVES,
    LICHESS_BOOK_AVG_RATINGS: LICHESS_BOOK_AVG_RATINGS,
    LICHESS_BOOK_TIME_CONTROLS: LICHESS_BOOK_TIME_CONTROLS,
    acceptLichessChallenge: acceptLichessChallenge,
    writeLichessBotChat: writeLichessBotChat,
    makeLichessBotMove: makeLichessBotMove,
    requestLichessBook: requestLichessBook,
    getLichessTourneys: getLichessTourneys,
    abortLichessGame: abortLichessGame
}

/*
{
  "type": "challenge",
  "challenge": {
    "id": "4x4HczZc",
    "status": "created",
    "challenger": {
      "id": "lishadowapps",
      "name": "lishadowapps",
      "title": null,
      "rating": 2182,
      "online": true,
      "lag": 4
    },
    "destUser": {
      "id": "atomicroulettebot",
      "name": "AtomicRouletteBot",
      "title": "BOT",
      "rating": 2025,
      "online": true
    },
    "variant": {
      "key": "atomic",
      "name": "Atomic",
      "short": "Atom"
    },
    "rated": false,
    "speed": "bullet",
    "timeControl": {
      "type": "clock",
      "limit": 60,
      "increment": 0,
      "show": "1+0"
    },
    "color": "random",
    "perf": {
      "icon": ">",
      "name": "Atomic"
    }
  }
}
*/

},{"./utils":10,"form-data":2}],9:[function(require,module,exports){
(function (process,__dirname){
const lichess = require('./lichess')
const utils = require('./utils')
const chessboard = require('./chessboard')

const STOCKFISH_JS_PATH             = "resources/client/cdn/stockfish.wasm.js"

const DEFAULT_REDUCE_THINKING_TIME  = 1

const path = require('path')
const spawn = require('child_process').spawn

const STOCKFISH_PATH = path.join(__dirname, "../../server/bin/stockfish")

class ServerEngine extends chessboard.AbstractEngine{
    constructor(sendanalysisinfo){
        super(sendanalysisinfo)

        this.minDepth = 10
    }

    processstdout(data){
        data = data.replace(/\r/g, "")        
        for(let line of data.split("\n")){
            this.processstdoutline(line)
        }
    }

    spawnengineprocess(){
        this.process = spawn(STOCKFISH_PATH)

        this.process.stdout.on('data', (data)=>{
            this.processstdout(`${data}`)
        })

        this.process.stderr.on('data', (data)=>{
            this.processstdout(`${data}`)
        })
    }

    terminate(){
        this.process.kill()
    }

    sendcommandtoengine(command){        
        this.process.stdin.write(command + "\n")     
    }
}

class LocalEngine_ extends chessboard.AbstractEngine{
    constructor(props){
        super(props.sendanalysisinfo)

        this.props = props
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
function LocalEngine(props){return new LocalEngine_(props)}

class LichessBotGame_{
    poweredBy(){
        this.writeBotChat(["player", "spectator"], `${this.botName} powered by https://easychess.herokuapp.com .`)
    }

    constructor(props){
        this.props = props

        this.parentBot = props.parentBot
        this.id = props.id        

        // abort game if not started
        setTimeout(() => lichess.abortLichessGame(this.id, this.parentBot.token), 30000)

        this.engine = (typeof window != "undefined") ?
        new LocalEngine({
            sendanalysisinfo: () => {}
        })
        :
        new ServerEngine(() => {})

        this.ratingDiff = 0

        this.gameStateReader = new utils.NdjsonReader(lichess.LICHESS_STREAM_GAME_STATE_URL + "/" + this.id, this.processGameEvent.bind(this), this.parentBot.token, this.processTermination.bind(this))

        this.gameStateReader.stream()
    }

    writeBotChat(rooms, msg){
        if(typeof process.env.DISABLE_BOT_CHAT != "undefined"){
            return
        }

        for(let room of rooms){
            lichess.writeLichessBotChat(this.id, room, msg, this.parentBot.token).then(result => {
                //
            })
        }
    }

    processGameEvent(event){
        if(event.type == "chatLine") return

        console.log(JSON.stringify(event, null, 2))

        if(event.type == "gameFull"){
            let gameFull = event
            this.gameFull = gameFull

            this.botTurn = chessboard.WHITE

            this.botRating = gameFull.white.rating || 1500
            this.oppRating = gameFull.black.rating || 1500

            this.botName = gameFull.white.name
            this.opponentName = gameFull.black.name

            if(gameFull.black.id == this.parentBot.userId){
                this.botTurn = chessboard.BLACK

                this.botRating = gameFull.black.rating || 1500
                this.oppRating = gameFull.white.rating || 1500

                this.botName = gameFull.black.name
                this.opponentName = gameFull.white.name
            }

            this.ratingDiff = this.oppRating - this.botRating

            this.variant = gameFull.variant.key

            this.testBoard = chessboard.ChessBoard().setfromfen(
                gameFull.initialFen == "startpos" ? null : gameFull.initialFen,
                this.variant
            )

            this.initialFen = this.testBoard.fen

            this.state = gameFull.state

            this.writeBotChat(["player", "spectator"], `Good luck, ${this.opponentName} !`)                
            
            this.poweredBy()
        }else if(event.type == "gameState"){
            this.state = event
        }

        if(this.gameFull && this.state){
            this.board = chessboard.ChessBoard().setfromfen(
                this.initialFen,
                this.variant
            )

            let allMovesOk = true

            this.moves = null

            if(this.state.moves){
                this.moves = this.state.moves.split(" ")
                for(let algeb of this.moves){
                    allMovesOk = allMovesOk && this.board.pushalgeb(algeb)
                }
            }                

            this.currentFen = this.board.fen

            console.log("allMovesOk", allMovesOk, this.board.toString())

            if(allMovesOk){
                if(this.board.turn == this.botTurn){
                    let lms = this.board.legalmovesforallpieces()

                    if(lms.length){
                        let reduceThinkingTime = this.parentBot.props.reduceThinkingTime || DEFAULT_REDUCE_THINKING_TIME

                        this.timecontrol = {
                            wtime:  this.state.wtime ? Math.floor(this.state.wtime / reduceThinkingTime) : 10000,
                            winc:   this.state.winc  || 0,
                            btime:  this.state.btime ? Math.floor(this.state.btime / reduceThinkingTime) : 10000,
                            binc:   this.state.binc  || 0,
                        }

                        if(this.timecontrol.wtime > utils.HOUR) this.timecontrol.wtime = 10000
                        if(this.timecontrol.btime > utils.HOUR) this.timecontrol.btime = 10000                            

                        if(this.parentBot.props.makeRandomMoves){
                            let selmove = lms[Math.floor(Math.random() * lms.length)]
                            let algeb = this.board.movetoalgeb(selmove)
                            this.playBotMove("random", {bestmove: algeb, scorenumerical: null})
                        }else{
                            let bookalgeb = null

                            if(this.parentBot.props.useOwnBook){
                                let weightIndices = this.parentBot.props.allowOpponentWeightsInBotBook ? [0, 1] : [0]
                                bookalgeb = this.parentBot.props.bookGame ? this.parentBot.props.bookGame.weightedAlgebForFen(currentFen, weightIndices) : null
                            }

                            ((
                                this.parentBot.props.useBotBook ||
                                ( this.parentBot.props.allowFallBackToBotBook && (!bookalgeb) )
                            ) ?
                                (lichess.requestLichessBook(
                                this.currentFen,
                                this.variant,
                                this.parentBot.props.lichessBookMaxMoves || lichess.LICHESS_BOOK_MAX_MOVES,
                                (this.parentBot.props.lichessBookAvgRatings || lichess.LICHESS_BOOK_AVG_RATINGS),
                                (this.parentBot.props.lichessBookTimeControls || lichess.LICHESS_BOOK_TIME_CONTROLS)
                            )) : utils.RP({moves: null})).then(result => {
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
                                    this.playBotMove("book", {bestmove: bookalgeb, scorenumerical: null})
                                }
                                else{
                                    this.moveOverHead = parseInt(this.parentBot.props.moveOverHead || chessboard.DEFAULT_MOVE_OVERHEAD)
                                    this.engine.play(this.initialFen, this.moves, this.variant, this.timecontrol, this.moveOverHead).then(
                                        this.playBotMove.bind(this, "engine")
                                    )
                                }
                            })                                
                        }                            
                    }
                }
            }
        }
    }

    playBotMove(method, moveObj){
        let move = this.board.algebtomove(moveObj.bestmove)

        let offeringDraw = false

        if(move){
            let msg = `My ${method} move : ${this.board.movetosan(move)} .`

            let randPercent = Math.round(Math.random() * 100)

            if(!(moveObj.scorenumerical === null)){
                let scorenumerical = moveObj.scorenumerical
                msg += ` Score numerical cp : ${scorenumerical} .`                
                if(this.moves && this.moves.length > 40){
                    if(this.ratingDiff > -200){
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

            lichess.makeLichessBotMove(this.id, moveObj.bestmove, offeringDraw, this.parentBot.token).then(result => {
                //
            })

            this.writeBotChat(["player", "spectator"], msg)
        }else{
            // try to make move anyway
            lichess.makeLichessBotMove(this.id, moveObj.bestmove, offeringDraw, this.parentBot.token).then(result => {
                //
            })
        }
    }

    processTermination(){
        console.log(`Game ${this.id} terminated .`)

        this.writeBotChat(["player", "spectator"], `Good game, ${this.opponentName} !`)
        this.poweredBy()
        this.engine.terminate()
    }
}
function LichessBotGame(props){return new LichessBotGame_(props)}

class LichessBot_{
    constructor(props){
        this.props = props

        this.token = props.token

        if(typeof window != "undefined") this.userId = utils.GET_USER().id
        else this.userId = "atomicroulettebot" //TODO

        this.acceptVariant = props.acceptVariant

        if(props.acceptVariant){
            if(typeof props.acceptVariant == "string") this.acceptVariant = props.acceptVariant.split(" ")
        }

        this.minInitialClock = props.minInitialClock || 60
    }

    toString(){
        return `bot ${this.token}`
    }

    challengeRefused(msg){
        console.log("Challenge refused .", msg)
    }

    processBotEvent(event){
        console.log(JSON.stringify(event, null, 2))

        if(event.type == "challenge"){
            let challenge = event.challenge

            if(this.acceptVariant){
                if(!this.acceptVariant.includes(challenge.variant.key)){
                    return this.challengeRefused(`Wrong variant . Acceptable variant(s) : ${this.acceptVariant.join(" , ")} .`)            
                }
            }

            if(challenge.timeControl.limit < this.minInitialClock){
                return this.challengeRefused(`Initial clock too low . Minimum initial clock : ${this.minInitialClock} sec(s) .`)            
            }

            lichess.acceptLichessChallenge(event.challenge.id, this.token)
        }else if(event.type == "gameStart"){
            LichessBotGame({
                parentBot: this,
                id: event.game.id
            })
        }
    }

    stream(){
        this.challengeReader = new utils.NdjsonReader(lichess.LICHESS_STREAM_EVENTS_URL, this.processBotEvent.bind(this), this.token)

        this.challengeReader.stream()
    }
}
function LichessBot(props){return new LichessBot_(props)}

module.exports.LichessBot = LichessBot

}).call(this,require('_process'),"/resources/client/nodejs")
},{"./chessboard":6,"./lichess":8,"./utils":10,"_process":5,"child_process":1,"path":4}],10:[function(require,module,exports){
const fetch = require('node-fetch')

const P = p => new Promise(p)

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 31 * DAY
const YEAR = 366 * DAY

function GET_PROPS(){    
    if(typeof PROPS != "undefined"){
        return PROPS
    }
    return ({})
}

function GET_USER(){        
    let user = GET_PROPS().USER
    if(typeof user != "undefined"){
        return user
    }
    return ({})
}

const RP = value => P(resolve => {
    resolve(value)
})

class OrderedHash_{
    constructor(blob){
        this.fromBlob(blob)
    }

    fromBlob(blobOpt){        
        this.blob = blobOpt || []
        return this
    }

    getKey(key){
        return this.blob.find(entry => entry[0] == key)
    }

    get(key){
        let entry = this.getKey(key)
        if(entry) return entry[1]
        return null
    }

    setKey(key, value){
        let entry = this.getKey(key)

        if(entry){
            entry[1] = value
            return
        }

        this.blob.push([key, value])
    }
}
function OrderedHash(blobOpt){return new OrderedHash_(blobOpt)}

Array.prototype.splitFilter =
    function(filterFunc){return [this.filter(filterFunc), this.filter(x => !filterFunc(x))]}

function logRemote(msg){
    if(typeof PROPS == "undefined") return
    let lru = PROPS.LOG_REMOTE_URL
    if(!lru) return
    if(PROPS.LOG_REMOTE) fetch(`${lru}${msg}`)
}

function readFile(file, method){
    return P(resolve=>{
        let reader = new FileReader()

        reader.onload = event => {          
            resolve(event)
        }

        reader[method](file)                
    })
}

let markdownconverter = null

try{
    markdownconverter = new showdown.Converter()
}catch(err){}

function IS_DEV(){
    if(typeof PROPS.IS_DEV != "undefined") return PROPS.IS_DEV
    return !!document.location.host.match(/localhost/)
}

Array.prototype.itoj = function(i, j){    
    while(i != j){
        const n = j > i ? i + 1 : i - 1;
        [ this[i], this[n] ] = [ this[n], this[i] ]
        i = n
    }
}

function UID(){
    return "uid_" + Math.random().toString(36).substring(2,12)
}

function cloneObject(obj){
    return JSON.parse(JSON.stringify(obj))
}

function simpleFetch(url, params, callback){
    params.headers = params.headers || {}
    if(params.asForm) params.headers["Content-Type"] = "application/x-www-form-urlencoded"
    if(params.asJson) params.headers.Accept = "application/json"    
    if(params.asVndLichessV3Json){
        params.headers.Accept = "application/vnd.lichess.v3+json"
        params.asJson = true
    }
    if(params.asNdjson) params.headers.Accept = "application/x-ndjson"
    if(params.accessToken) params.headers.Authorization = "Bearer " + params.accessToken    
    if(params.server) api("request:fetch", {
        url: url,
        params: params
    }, result => callback(result))
    else fetch(url, params).then(
        response => response.text().then(
            text => {                                 
                if(params.asJson || params.asNdjson){
                    try{
                        let obj
                        if(params.asNdjson){                            
                            obj = text.split("\n").filter(line => line.length).map(line => JSON.parse(line))
                        }else{
                            obj = JSON.parse(text)
                        }                                                
                        try{
                            callback({ok: true, content: obj})
                        }catch(err){
                            console.log(err, obj)
                        }
                    }catch(err){
                        console.log("fetch parse json error", err)
                        callback({ok: false, status: "Error: Could not parse json."})
                    }
                }else{
                    callback({ok: true, content: text})
                }                
            },
            err => {
                console.log("fetch get response text error", err)                
                callback({ok: false, status: "Error: Failed to get response text."})
            }
        ),
        err => {
            console.log("fetch error", err)
            callback({ok: false, status: "Error: Failed to fetch."})
        }
    )
}

function api(topic, payload, callback){
    fetch('/api', {
        method: "POST",
        headers: {
           "Content-Type": "application/json"
        },
        body: JSON.stringify({
            topic: topic,
            payload: payload
        })
    }).then(
        response => response.text().then(
            text => {
                try{                    
                    let response = JSON.parse(text)
                    callback(response)
                }catch(err){
                    console.log("parse error", err)
                    callback({error: "Error: Could not parse response JSON."})
                }                
            },
            err => {
                console.log("api error", err)
                callback({error: "Error: API error in get response text."})
            }
        ),
        err => {
            console.log("api error", err)
            callback({error: "Error: API error in fetch."})
        }
    )
}

function storeLocal(key, obj){
    localStorage.setItem(key, JSON.stringify(obj))
}

function getLocal(key, def){
    let stored = localStorage.getItem(key)
    if(stored) return JSON.parse(stored)
    return def
}

class NdjsonReader{
    constructor(url, processLineFunc, accessTokenOpt, onTerminated){
        this.url = url
        this.processLineFunc = processLineFunc
        this.accessTokenOpt = accessTokenOpt
        this.onTerminated = onTerminated
    }

    processChunk(chunk){            
        let content = this.pendingChunk + ( this.nodeReader ? chunk.toString() : new TextDecoder("utf-8").decode(chunk.value) )
        if(content.length > 1) console.log(content)
        let closed = content.match(/\n$/)
        let hasline = content.match(/\n/)
        let lines = content.split("\n")                
        if(hasline){
            if(!closed){
                this.pendingChunk = lines.pop()
            }
            for(let line of lines){
                if(line != "") this.processLineFunc(JSON.parse(line))
            }            
        }else{
            this.pendingChunk += content
        }        
        return true
    }

    read(){        
        this.reader.read().then(
            chunk => {
                if(chunk.done){
                    if(this.onTerminated) this.onTerminated()
                    return false
                }
                this.processChunk(chunk)
                this.read()
            },
            err => console.log(err)
        )    
    }

    stream(){        
        let headers = {
            "Accept": "application/x-ndjson"
        }        

        if(this.accessTokenOpt) headers.Authorization = `Bearer ${this.accessTokenOpt}`
        
        fetch(this.url, {
            headers: headers
        }).then(
            response => {        
                this.pendingChunk = ""
                this.nodeReader = false
                try{
                    this.reader = response.body.getReader()
                    this.read()        
                }catch(err){                    
                    console.log("could not get reader, trying node reader")                                        
                    this.nodeReader = true
                    response.body.on('data', (chunk) => {                        
                        this.processChunk(chunk)
                    })
                    response.body.on('end', () => {
                        try{
                            this.onTerminated()
                        }catch(err){}
                    })
                }                
            },
            err => {
                console.log(err)
            }
        )
    }
}

function getclassforpiece(p, style){
    let kind = p.kind
    if(p.color == WHITE) kind = "w" + kind
    return ( style || "alpha" ) + "piece" + kind
}

class Vect_{
    constructor(x, y){
        this.x = x
        this.y = y
    }

    p(v){
        return Vect(this.x + v.x, this.y + v.y)
    }

    m(v){
        return Vect(this.x - v.x, this.y - v.y)
    }

    l(){
        return Math.sqrt(this.x*this.x + this.y*this.y)
    }

    s(s){
        return Vect(s*this.x, s*this.y)
    }
}
function Vect(x,y){return new Vect_(x,y)}

function getStyle(className) {
    let cssText = ""
    for(let si=0;si<document.styleSheets.length;si++){
        let classes = document.styleSheets[si].rules || document.styleSheets[0].cssRules
        for (let x = 0; x < classes.length; x++) {                            
            if (classes[x].selectorText == className) {
                cssText += classes[x].cssText || classes[x].style.cssText
            }         
        }
    }    
    return cssText
}

function scoretocolor(score){
    return Math.floor(Math.min(( Math.abs(score) / 1000.0 ) * 192.0 + 63.0, 255.0))
}

function scoretorgb(score){
    return `rgb(${score < 0 ? scoretocolor(score) : 0},${score > 0 ? scoretocolor(score) : 0},0)`
}

//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
seed = 1
function random(){
    seed += 1
    x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function randcol(){
	return Math.floor(128 + random() * 128)
}

function randrgb(){
	return `rgb(${randcol()},${randcol()},${randcol()})`
}

function getelse(obj, key, defaultvalue){
    if(key in obj) return obj[key]
    return defaultvalue
}

function createZip(content, nameOpt){
    let name = nameOpt || "backup"

    let zip = new JSZip()

    zip.file(name, content)

    return zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }            
    })
}

function unZip(content, nameOpt){
    let name = nameOpt || "backup"
    
    let unzip = new JSZip()            

    return P(resolve => {
        unzip.loadAsync(content, {base64: true}).then(unzip =>
            unzip.file(name).async("text").then(content => resolve(content)))
    })        
}

function downloadcontent(content, name){
    let file = new Blob([content])
    let a = document.createElement("a")
    let url = URL.createObjectURL(file)
    a.href = url
    a.download = name || "download.txt"
    document.body.appendChild(a)        
    a.click()
    setTimeout(function(){
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }, 0)
}

function blobToDataURL(blob) {return P(resolve => {
    readFile(blob, "readAsDataURL").then(ev => {
        resolve(ev.target.result)
    })
})}

function md2html(content){
    let html = markdownconverter.makeHtml(content)
    html = html.replace(/<a href=/g, `<a rel="noopener noreferrer" target="_blank" href=`)
    return html
}

const MOVE_COLOR_PRESETS = {
    "0,0": "#99f",
    "0,1": "#f00"
}

function movecolor(weights){
    let presetkey = `${weights[0]},${weights[1]}`
    let preset = MOVE_COLOR_PRESETS[presetkey]
    if(preset){
        return preset
    }
    return `rgb(${weights[1] ? 255 - weights[1]/10*255 : 0},${(160+weights[0]/10*95)*(weights[1] > 0 ? 0.7 : 1)},0)`
}

function scrollBarSize(){
    return 14
}

function displayNameForVariantKey(variantKey){
    return variantKey.substring(0,1).toUpperCase() + variantKey.substring(1)
}

function pgnVariantToVariantKey(pgnVariant){    
    return pgnVariant.substring(0,1).toLowerCase() + pgnVariant.substring(1)
}

function parsePgnPartsFromLines(lines){
    let parseHead = true
    let parseBody = false
    let headers = []
    let bodyLines = []

    // remove leading empty lines
    while(lines.length && (!lines[0])) lines.shift()
    
    do{
        let line = lines.shift()
        let m
        if(parseHead){
            if(!line){
                parseHead = false
            }else if(m = line.match(/^\[([^ ]+) \"([^\"]+)/)){                
                headers.push([m[1], m[2]])
            }else{
                parseHead = false
                lines.unshift(line)
            }
        }else{
            if(parseBody){
                if(!line){
                    return [lines, headers, bodyLines.join("\n")]
                }else{
                    bodyLines.push(line)
                }
            }else if(line){
                parseBody = true
                bodyLines.push(line)
            }
        }
    }while(lines.length)
    
    return [lines, headers, bodyLines.join("\n")]
}

function confirm(msg, ack){
    let conf = window.prompt(`${msg} Type " ${ack} " to confirm.`)

    return conf == ack
}

module.exports = {
    P: P,
    RP: RP,
    simpleFetch: simpleFetch,
    GET_PROPS: GET_PROPS,
    GET_USER: GET_USER,
    NdjsonReader: NdjsonReader,    
}

module.exports.SECOND = SECOND
module.exports.MINUTE = MINUTE
module.exports.HOUR = HOUR
module.exports.DAY = DAY
module.exports.WEEK = WEEK
module.exports.MONTH = MONTH
module.exports.YEAR = YEAR

},{"node-fetch":3}]},{},[7]);

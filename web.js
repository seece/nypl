(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
    try {
        cachedSetTimeout = setTimeout;
    } catch (e) {
        cachedSetTimeout = function () {
            throw new Error('setTimeout is not defined');
        }
    }
    try {
        cachedClearTimeout = clearTimeout;
    } catch (e) {
        cachedClearTimeout = function () {
            throw new Error('clearTimeout is not defined');
        }
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
"use strict";
var util = require("util");
var exports = module.exports = {};

class Token {
    constructor(line, column) {
        this.line = line;
        this.col = column;
        this.text = ""; // inner text, e.g. string without quotes
        this.lexeme = ""; // full token text, e.g. string with quotes
    }
}

class Word extends Token {
    constructor(column, word) {
        super(0, column);
        this.text = word;
        this.lexeme = word;
    }
}

class Definition extends Token{
    constructor(column, name, content, tokens) {
        super(0, column);
        this.name = name;
        this.code = content;
        this.tokens = tokens;
        this.text = content;
        this.lexeme = content;
    }
}


class Literal extends Token {
    constructor(column, text) {
        super(0, column);
        this.text = text;
        this.lexeme = text;
    }
}

class NumberLiteral extends Literal {
    constructor(column, text) {
        super(column, text);
    }
}

class StringLiteral extends Literal {
    constructor(column, text) {
        super(column, text);
        this.lexeme = '"' + text + '"';
    }
}

class Quotation extends Literal {
    constructor(column, col, text) {
        super(column, text);
        this.col = col
        this.lexeme = '(' + text + ')';
    }
}

var log = console.log;

var parse = function(code, _context) {
    let pos = 0; // points to the next character to be read
    const EOF = -1;
    let context = _context || {"offset" : 0};

    let getColumn = () => {
        return context.offset + pos-1;
    }

    let scanningError = (msg) => {
        return "ScanningError at "+(getColumn())+": " + msg;
    }

    let peek = () => {
        if (pos >= code.length) {
            return EOF;
        }

        let c = code[pos];
        return c;
    };

    let getLast = () => {
        if (pos > code.length) {
            return EOF;
        }

        return code[pos-1];
    }

    let read = () => {
        if (pos >= code.length) {
            return EOF;
        }
        let c = code[pos];
        pos++;
        return c;
    }

    let program = () => {
    };

    let isBuiltin = (s) => {
        return /[a-zäöå\.+-/*%!?=<>t]/.test(s);
    }

    let isUserword = (s) => {
        return /[A-ZÄÖÅ]/.test(s);
    }

    let isWhitespace = (s) => {
        return /\s/.test(s);
    }

    let isDigit = (s) => {
        if (s == EOF) { return false; } // EOF = -1 casts to "-1" which matches
        return /\d/.test(s);
    }

    let in_string = false;
    let c = read();
    let current = "";

    // We assume isDigit(read()) = true
    let readNumber = () => {
        let digit = getLast();

        while (isDigit(peek())) {
            digit += read();
        }

        if (peek() == ".") {
            digit += read();
            while (isDigit(peek())) {
                digit += read();
            }
        }

        let number = new NumberLiteral(getColumn(), digit);
        return number;
    }

    let readWord = () => {
        // All identifiers are single characters.
        return new Word(getColumn(), getLast());
    }

    let readString = () => {
        let str = "";

        let c = read();
        while (c != EOF) {
            if (c == "\\") {
                let esc = read();
                let escapes = {
                    "n" : "\n",
                    "t" : "\t",
                    '"' : '"',
                }
                if (esc in escapes) {
                    str += escapes[esc];
                } else {
                    throw scanningError("Invalid escape char: " + esc);
                }
            } else if (c == "\"") {
                break;
            } else {
                str += c;
            }

            c = read();
        }

        return new StringLiteral(getColumn(), str);
    }

    let skipWhitespace = () => {
        while (isWhitespace(peek()) && peek() != EOF) {
            read();
        }
    }

    let readDefinition = () => {
        skipWhitespace();
        let userword = read();
        let c = read();
        let usercode = ""
        while (c != ";") {
            if (peek() == EOF) {
                throw scanningError("Unexpected EOF when reading a definition.");
            }
            usercode += c;
            c = read();
        }

        var tokens = parse(usercode, {
            "desc" : "definition of "+userword,
            "offset" : getColumn()});
        return new Definition(getColumn(), userword, usercode, tokens);
    }

    let readQuotation = () => {
        let col = getColumn();
        let quot = "";
        let parenDepth = 1;

        let c = read();

        while (parenDepth > 0) {
            if (c == EOF) {
                throw scanningError("Unexpected EOF when reading a quotation.");
            }

            if (c == '"') {quot += '"' + readString().text }
            if (c == "(") {parenDepth++;}
            if (c == ")") {
                parenDepth--;
                if (parenDepth == 0) {
                    break;
                }
            }

            quot += c;
            c = read();
        }

        return new Quotation(getColumn(), col, quot);
    }

    let tokens = [];

    while (c != EOF) {
        //log("c:'" + c + "'");
        if (!isWhitespace(c)) {
            if (c == '"') {
                tokens.push(readString());
            } else if (isDigit(c) || c == '-' && isDigit(peek())) {
                tokens.push(readNumber());
            } else if (isUserword(c) || isBuiltin(c)) {
                tokens.push(readWord());
            } else if (c == ':') {
                tokens.push(readDefinition());
            } else if (c == '(') {
                tokens.push(readQuotation());
            } else {
                throw scanningError("Invalid character '" + c + "' at " + (getColumn()));
            }
        }
        c = read();
    }

    return tokens;
}

class Value {
    constructor(type, val, col) {
        this.type = type;
        this.val = val;
        this.col = col;
    }

    shortType() {
        let abbr = {
            "string" : "s",
            "bool" : "b",
            "number" : "n",
            "quotation" : "q"
        };

        if (this.type in abbr) {return abbr[this.type]};
        return this.type;
    }

    toString() {
        if (this.type == "quotation") {
            return "q" + this.col;
        }
        return this.shortType() + ":" + this.val;
        //return this.val;
    }

    // Returns a string that returns the exact same value when evaluated.
    toLiteral() {
        if (this.type == "string") {
            return '"' + this.val + '"';
        } else if (this.type == "bool") {
            return this.val ? "1" : "0";
        } else if (this.type == "number") {
            return this.val;
        } else if (this.type == "quotation") {
            return '(' + this.val + ')';
        }
        return this.val;
    }
}


let runtimeError = function(msg) {
    return "runtimeError: " + msg;
}


let execute = function(prog, outputCallback, in_words, in_stack, in_indent) {
    // The caller can pass in a stack and a dictionary context.
    // They are used in quotation invocation.
    let stack = in_stack || [];
    let indent = in_indent || 0;

    let pop = () => {
        if (stack.length == 0) {
            throw runtimeError("Stack underflow!");
        }
        return stack.pop();
    }

    let push = (a) => {
        stack.push(a);
    }

    let output = outputCallback || ((obj) => {
        console.log(">> ", obj);
    })

    let makenum = (v) => (new Value("number", v));
    let makebool = (v) => (new Value("bool", v));
    let type_assert = function(type, v) {
        if (v.type != type){throw runtimeError("Got value of type " + v.type + " instead of " + type + "!")}
    }

    let runQuotation = (src) => {
        let new_prog = parse(src.val, {"offset" : src.col });
        //log("  src: '" + src.val + "'");
        //log("  compiled: ", new_prog);
        execute(new_prog, outputCallback, words, stack, indent+1);
    }

    let map_list_index = (ind, the_list) => {
        let new_ind = ind;
        if (ind < 0) {
            new_ind = the_list.length + ind;
        }

        if (new_ind >= the_list.length || new_ind < 0) {
            throw runtimeError("Trying to read index " + ind + " from list of size " + the_list.length + "!");
        }

        return new_ind;
    };

    let builtinWords = {
        "d" : () => {
            let a = pop();
            push(a);
            push(a);},
        "x" : () => {
            pop();},
        "." : () => {output(pop().val)},
        "s" : () => {
            let a = pop();
            let b = pop();
            stack.push(a);
            stack.push(b);
        },
        "r" : () => {
            let c = pop();
            let b = pop();
            let a = pop();
            push(c);
            push(a);
            push(b);
        },
        "+" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(b.val + a.val));},
        "-" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(b.val - a.val));},
        "/" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(b.val / a.val));},
        "%" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(b.val % a.val));},
        "*" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            push(makenum(a.val * b.val))},
        "=" : () => {
            let a = pop();
            let b = pop();
            // allow true == 1.0 --> true
            stack.push(makebool(a.val == b.val));},
        "<" : () => {
            let a = pop();
            let b = pop();
            stack.push(makebool(b.val < a.val));},
        ">" : () => {
            let a = pop();
            let b = pop();
            stack.push(makebool(b.val > a.val));},
        "!" : () => {
            let a = pop();
            if (a.val) {
                push(makebool(false));
            } else {
                push(makebool(true));
            }},
        "?" : () => {
            let else_quot = pop();
            let then_quot = pop();
            let if_quot = pop();
            type_assert("quotation", if_quot);
            type_assert("quotation", then_quot);
            type_assert("quotation", else_quot);
            runQuotation(if_quot);
            let result = pop();
            type_assert("bool", result);
            if (result.val) {
                runQuotation(then_quot);
            } else {
                runQuotation(else_quot);
            }
        },
        "t" : () => {
            let src = pop();
            let amt = pop();
            type_assert("number", amt);
            type_assert("quotation", src);
            let new_prog = parse(src.val, {"offset" : src.col });
            let times = amt.val;
            while (times > 0) {
                times--;
                execute(new_prog, outputCallback, words, stack, indent+1);
            }
        },
        "i" : () => {
            let src = pop();
            type_assert("quotation", src);
            runQuotation(src);
        },
        "å" : () => {
            output(stack);
        },
        "g" : () => {
            let index = pop();
            let list = pop();
            type_assert("number", index);
            type_assert("quotation", list);

            let ind = Math.floor(index.val);
            let list_tokens = parse(list.val, {"offset" : list.col });

            if (ind < 0 || ind >= list_tokens.length) {
                throw runtimeError("Index " + ind + " out of range.");
            }

            // We extract an item from the list and return it wrapped in a
            // quotation. If the programmer wants the underlying value the
            // quotation can be just evaluated.

            let item = list_tokens[ind];
            //console.log(list);
            //console.log(list_tokens);
            //console.log("index", ind);
            //console.log(item);

            push(new Value("quotation", item.lexeme, item.col));
        },
        "c" : () => {
            let separator = pop();
            let str = pop();
            type_assert("string", separator);
            type_assert("string", str);
            // log(separator);
            // log(str);
            let list = str.val.split(separator.val);
            // log(list);
            let stringified_list = (list.map((x) => {return '"' + x + '"';})).join(" ");
            // log(stringified_list);
            // TODO str.col is incorrect, should be actually position of "c"
            push(new Value("quotation", stringified_list, str.col));
        },
        "m" : () => {
            let func = pop();
            let list = pop();
            type_assert("quotation", func);
            type_assert("quotation", list);

            let list_tokens = parse(list.val, {"offset" : list.col });
            let func_tokens = parse(func.val, {"offset" : func.col });

            for (let i = 0; i < list_tokens.length; i++) {
                // Read the array slot value from index i using the built-in
                // word g, and push it up on the stack ready for the 'func'
                // quotation to consume.
                let token = list_tokens[i];
                let new_prog = parse(i + "g", {"offset" : token.col });
                push(list);
                execute(new_prog, outputCallback, words, stack, indent);
                execute(func_tokens, outputCallback, words, stack, indent+1);
            }
        },
        "w" : () => {
            let number_val = pop();
            type_assert("number", number_val);
            let count = number_val.val;

            if (count < 0) {
                throw runtimeError("Trying to read " + count + " values from the stack.");
            }

            let literals = [];

            for (let i = 0; i < count; i++) {
                let value = pop();
                literals.push(value.toLiteral());
            }

            let literal_string = '(' + literals.join(" ") + ')';
            // console.log("literal string: " + literal_string);

            // Push the collected values to the stack as a quotation.

            // TODO numberval_col is incorrect, should be position of w
            let program = parse(literal_string, {"offset" : number_val.col });
            execute(program, outputCallback, words, stack, indent);
        },
        "u" : () => {
            let list = pop();
            type_assert("quotation", list);
            let list_tokens = parse(list.val, {"offset" : list.col });
            let literals = [];

            for (let token of list_tokens) {
                literals.push(token.lexeme);
            }

            let literal_string = literals.join(" ");
            console.log("unwrap literal string: " + literal_string);

            // Push the collected values to the stack individually.
            // TODO list.col is incorrect, should be position of w
            let program = parse(literal_string, {"offset" : list.col });
            execute(program, outputCallback, words, stack, indent);
        },
    };

    let words = in_words || {};
    Object.assign(words, builtinWords);

    for (let token of prog) {
        log(" ".repeat(indent) + token.text+ "\t" + "[" + stack + "]");

        //log("--> "+inspect(token) + "\nstack: ", util.inspect(stack));
        if (token instanceof StringLiteral) {
            stack.push(new Value("string", token.text, token.col));
        } else if (token instanceof Quotation) {
            stack.push(new Value("quotation", token.text, token.col));
        } else if (token instanceof NumberLiteral) {
            stack.push(new Value("number", parseFloat(token.text), token.col));
        } else if (token instanceof Word) {
            if (!(token.text in words)) {
                throw runtimeError("Non-existent word at "+token.col +": " + util.inspect(token));
            }

            words[token.text](stack);

        } else if (token instanceof Definition) {
            if (token.name in builtinWords) {
                throw runtimeError("Trying to redefine builtin word at "+token.col+": " + token.name);
            }

            // The stack needs to get passed in as an argument since the variable 'stack'
            // would otherwise point to an object instance created on an earlier execute()
            // invocation. This is the case when running inside REPL.
            words[token.name] = (in_stack) => {
                execute(token.tokens, outputCallback, words, in_stack);
            };

        } else {
            throw runtimeError("Invalid token at "+token.col+": " + util.inspect(token));
        }
    }

    return stack
}

let run = function(src, outputCallback, logCallback, words, stack) {
    return execute(parse(src), outputCallback, words, stack);
}

exports.parse = parse;
exports.execute = execute;
exports.run = run;


},{"util":4}],6:[function(require,module,exports){
(function (global){
// browserify webnypl.js -o web.js
"use strict";
global.nypl = require('./interpreter');
global.inspect = require('util').inspect;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./interpreter":5,"util":4}]},{},[6]);

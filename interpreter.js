"use strict";
var util = require("util");
var fuse = require("fuse.js");
var exports = module.exports = {};

var log = console.log;

var parse = function(code, _context) {
    let pos = 0; // points to the next character to be read
    const EOF = -1;
    let context = _context || {"offset" : 0};

    let getColumn = () => {
        return context.offset + pos-1;
    }

    let parsingError = (msg) => {
        return "Parsing error at "+(getColumn())+": " + msg;
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
        return /[a-zäöå\.+-/*%!?=<>_]/.test(s);
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

        return parseInt(digit);
    }

    let readCall = () => {
        let name = getLast();
        let f = () => {
            log("stub: calling word '" + name + "'");
        }
        f.toString = ()=>{return "Call '"+name+"'";}
        return f;
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
                    throw parsingError("Invalid escape sequence: " + esc);
                }
            } else if (c == "\"") {
                break;
            } else {
                str += c;
            }

            c = read();
        }

        return str;
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
                throw parsingError("Unexpected EOF when reading a definition.");
            }
            usercode += c;
            c = read();
        }

        /*
        var tokens = parse(usercode, {
            "desc" : "definition of "+userword,
            "offset" : getColumn()});
        return new Definition(getColumn(), userword, usercode, tokens);
        */
        // FIXME actually save the definition to a map
        log("read definition for user word '"+userword+"': " + usercode);
        return -999;
    }

    let readList = () => {
        let col = getColumn();
        let inner = "";
        let parenDepth = 1;

        let c = read();

        while (parenDepth > 0) {
            if (c == EOF) {
                throw parsingError("Unexpected EOF when reading a quotation.");
            }

            if (c == '"') {inner += '"' + readString();}
            if (c == "(") {parenDepth++;}
            if (c == ")") {
                parenDepth--;
                if (parenDepth == 0) {
                    break;
                }
            }

            inner += c;
            c = read();
        }

        return parse(inner, {"offset" : getColumn()});
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
                tokens.push(readCall());
            } else if (c == ':') {
                tokens.push(readDefinition());
            } else if (c == '(') {
                tokens.push(readList());
            } else {
                throw parsingError("Invalid character '" + c + "' at " + (getColumn()+1));
            }
        }
        c = read();
    }

    // We want lists to be wrapped in parens when printed.
    tokens.toString = () => {
        return "("+Array.prototype.toString.apply(tokens)+")";
    }
    return tokens;
}

let execute = function(prog, outputCallback, externals, in_words, in_stack, in_indent) {
    let output = outputCallback || ((obj) => {
        console.log(">> ", obj);
    })
    output("execute stub");
}

let run = function(code, cb, extfuncs, words, stack) {
    log("got code: " + code);
    let parsed_code = parse(code);
    log("parsed: " + parsed_code);

    return stack;
}

exports.parse = parse;
exports.execute = execute;
exports.run = run;


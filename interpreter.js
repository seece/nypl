"use strict";

class Token {
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }
}

class WordToken extends Token {
    constructor(column, word) {
        super(0, column);
        this.word = word;
    }
}

class DefinitionToken extends Token {
    constructor(column, name, content) {
        super(0, column);
        this.name = name;
        this.content = content;
    }
}


class LiteralToken extends Token {
    constructor(column, value) {
        super(0, column);
        this.value = value;
    }
}

class QuotationToken extends LiteralToken {
    constructor(column, value) {
        super(column, value);
        this.value = value;
    }
}

var log = console.log;

var parse = function(code) {
    let pos = 0; // points to the next character to be read
    const EOF = -1;

    let scanningError = function(msg) {
        return "ScanningError at "+(pos-1)+": " + msg;
    }

    let peek = function() {
        if (pos >= code.length) {
            return EOF;
        }

        let c = code[pos];
        return c;
    };

    let getLast = function() {
        if (pos > code.length) {
            return EOF;
        }

        return code[pos-1];
    }

    let read = function() {
        if (pos >= code.length) {
            return EOF;
        }
        let c = code[pos];
        pos++;
        return c;
    }

    let program = function() {
    };

    let isBuiltin = function(s) {
        return /[a-zäöå\.+-/*%]/.test(s);
    }

    let isUserword = function(s) {
        return /[A-ZÄÖÅ]/.test(s);
    }

    let isWhitespace = function(s) {
        if (s == EOF) { return true; }
        return /\s/.test(s);
    }

    let isDigit = function(s) {
        return /\d/.test(s);
    }

    let in_string = false;
    let c = read();
    let current = "";

    // We assume isDigit(read()) = true
    let readNumber = function() {
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

        return new LiteralToken(pos-1, digit);
    }

    let readWord = function() {
        // All identifiers are single characters.
        return new WordToken(pos-1, getLast());
    }

    let readString = function() {
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

        return new LiteralToken(pos-1, str);
    }

    let skipWhitespace = function() {
        while (isWhitespace(peek()) && peek() != EOF) {
            read();
        }
    }

    let readDefinition = function() {
        read(); // skip the colon
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

        return new DefinitionToken(pos-1, userword, usercode);
    }

    let readQuotation = function() {
        let quot = "";
        let parenDepth = 1;

        let c = read();

        while (parenDepth > 0) {
            if (c == EOF) {
                throw scanningError("Unexpected EOF when reading a quotation.");
            }

            if (c == '"') {quot += '"' + readString() + '"'}
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

        return new QuotationToken(pos-1, quot);
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
                throw scanningError("Invalid character '" + c + "' at " + (pos-1));
            }
        }
        c = read();
    }

    return tokens;
}

let runTest = function(src) {
    log(src);
    let prog = parse(src);
    log(prog);
}

runTest(" 13 2+.0.5 -10.1 *.");
runTest(" \"hello \\\"world\\\" :)\"");
runTest(" :  Xxxpp;");
runTest(" (4 d *.)i.");


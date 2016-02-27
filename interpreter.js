"use strict";
var util = require("util");

class Token {
    constructor(line, column) {
        this.line = line;
        this.col = column;
        this.value = ""
    }
}

class Word extends Token {
    constructor(column, word) {
        super(0, column);
        this.value = word;
    }
}

class Definition extends Token{
    constructor(column, name, content) {
        super(0, column);
        this.name = name;
        this.code = content;
    }
}


class Literal extends Token {
    constructor(column, value) {
        super(0, column);
        this.value = value;
    }
}

class NumberLiteral extends Literal {
    constructor(column, value) {
        super(column, value);
    }
}

class StringLiteral extends Literal {
    constructor(column, value) {
        super(column, value);
    }
}

class Quotation extends Literal {
    constructor(column, startColumn, value) {
        super(column, value);
        this.startColumn = startColumn
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
        return /[a-zäöå\.+-/*%]/.test(s);
    }

    let isUserword = (s) => {
        return /[A-ZÄÖÅ]/.test(s);
    }

    let isWhitespace = (s) => {
        return /\s/.test(s);
    }

    let isDigit = (s) => {
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

        return new Definition(getColumn(), userword, usercode);
    }

    let readQuotation = () => {
        let startColumn = getColumn();
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

        return new Quotation(getColumn(), startColumn, quot);
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
    constructor(type, val, startColumn) {
        this.type = type;
        this.val = val;
        this.startColumn = startColumn;
    }
}

let runtimeError = function(msg) {
    return "runtimeError: " + msg;
}

let execute = function(prog, in_words, in_stack) {
    // The caller can pass in a stack and a dictionary context.
    // They are used in quotation invocation.
    let stack = in_stack || [];

    let pop = () => {
        if (stack.length == 0) {
            throw runtimeError("Stack underflow!");
        }
        return stack.pop();
    }
    let push = (value) => {
        stack.push(value);
    }
    let output = (obj) => {
        console.log("> ", obj);
    }

    let builtinWords = {
        "d" : () => {
            let a = pop();
            push(a);
            push(a);},
        "x" : () => {
            pop();},
        "." : () => {output(stack.pop())},
        "+" : () => {stack.push(stack.pop() + stack.pop());},
        "-" : () => {
            let a = pop();
            let b = pop();
            stack.push(a.val - b.val);},
        "/" : () => {
            let a = pop();
            let b = pop();
            stack.push(a.val / b.val);},
        "*" : () => {
            let a = pop();
            let b = pop();
            stack.push(a.val * b.val);},
        "i" : () => {
            console.log(stack);
            let src = pop();
            if (src.type != "quotation") {
                throw runtimeError("Trying to execute value of type " + src.type);
            }
            let new_prog = parse(src.val, {"offset" : src.startColumn });
            log("  src: '" + src.val + "'");
            log("  compiled: ", new_prog);
            execute(new_prog, words, stack);
        },
    };

    let words = in_words || {};
    Object.assign(words, builtinWords);

    for (let token of prog) {
        log("stack: ", stack);
        if (token instanceof StringLiteral) {
            stack.push(new Value("string", token.value, token.col));
        } else if (token instanceof Quotation) {
            stack.push(new Value("quotation", token.value, token.startColumn));
        } else if (token instanceof NumberLiteral) {
            stack.push(new Value("number", parseFloat(token.value), token.col));
        } else if (token instanceof Word) {
            if (!(token.value in words)) {
                throw runtimeError("Non-existent word at "+token.col +": " + util.inspect(token));
            }

            words[token.value]();

        } else if (token instanceof Definition) {
            if (token.name in builtinWords) {
                throw runtimeError("Trying to redefine builtin word at "+token.col+": " + token.name);
            }

        } else {
            throw runtimeError("Invalid token at "+token.col+": " + util.inspect(token));
        }

    }

    return stack
}

let runTest = function(src) {
    log("\nsrc: ", src);
    let prog = parse(src);
    log("prog: ", prog);
    log("result: ", execute(prog));
}

runTest(" 13 2+.0.5 -10.1 *.");
runTest(" \"hello \\\"world\\\" :)\"");
runTest(" :  Xxxpp;");
runTest("4 d *.");
runTest(" (4 d *)i.");


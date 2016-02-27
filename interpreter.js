"use strict";
var util = require("util");
var exports = module.exports = {};

class Token {
    constructor(line, column) {
        this.line = line;
        this.col = column;
        this.value = ""; // basically the parse lexeme
    }
}

class Word extends Token {
    constructor(column, word) {
        super(0, column);
        this.value = word;
    }
}

class Definition extends Token{
    constructor(column, name, content, tokens) {
        super(0, column);
        this.name = name;
        this.code = content;
        this.tokens = tokens;
        this.value = content;
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
    constructor(column, col, value) {
        super(column, value);
        this.col = col
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
        return /[a-zäöå\.+-/*%!?=]/.test(s);
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

            if (c == '"') {quot += '"' + readString().value }
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
    }
}


let runtimeError = function(msg) {
    return "runtimeError: " + msg;
}

let execute = function(prog, outputCallback, in_words, in_stack) {
    // The caller can pass in a stack and a dictionary context.
    // They are used in quotation invocation.
    let stack = in_stack || [];

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
        if (v.type != type){throw runtimeError("Got value of type " + v.type + " insted of " + type + "!")}
    }

    let runQuotation = (src) => {
        let new_prog = parse(src.val, {"offset" : src.col });
        //log("  src: '" + src.val + "'");
        //log("  compiled: ", new_prog);
        execute(new_prog, outputCallback, words, stack);
    }

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
            stack.push(makenum(a.val + b.val));},
        "-" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(a.val - b.val));},
        "/" : () => {
            let a = pop();
            let b = pop();
            type_assert("number", a);
            type_assert("number", b);
            stack.push(makenum(a.val / b.val));},
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
        "i" : () => {
            let src = pop();
            type_assert("quotation", src);
            runQuotation(src);
        },
        "å" : () => {
            output(stack);
        },
    };

    let words = in_words || {};
    Object.assign(words, builtinWords);

    for (let token of prog) {
        //log("--> "+inspect(token) + "\nstack: ", util.inspect(stack));
        if (token instanceof StringLiteral) {
            stack.push(new Value("string", token.value, token.col));
        } else if (token instanceof Quotation) {
            stack.push(new Value("quotation", token.value, token.col));
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

            words[token.name] = () => {
                execute(token.tokens, outputCallback, words, stack);
            };

        } else {
            throw runtimeError("Invalid token at "+token.col+": " + util.inspect(token));
        }

        log(token.value+ "\t" + "[" + stack + "]");
    }

    return stack
}

let runTest = function(src) {
    //log("\nsrc: ", src);
    let prog = parse(src);
    //log("prog: ", prog);
    //log("result: ", execute(prog));
}

let run = function(src, outputCallback, words, stack) {
    return execute(parse(src), outputCallback, words, stack);
}

runTest(" 13 2+.0.5 -10.1 *.");
runTest(" \"hello \\\"world\\\" :)\"");
runTest(" :  Xxxpp;");
runTest("4 d *.");
runTest(" (4 d *)i.");
runTest("5");

exports.parse = parse;
exports.execute = execute;
exports.run = run;


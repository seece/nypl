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

let run = function(src, outputCallback, words, stack) {
    return execute(parse(src), outputCallback, words, stack);
}

exports.parse = parse;
exports.execute = execute;
exports.run = run;


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

class List extends Literal {
    constructor(column, col, text, elements) {
        super(column, text);
        this.col = col;
        this.elements = elements;
        this.lexeme = '[' + text + ']';
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
                    throw parsingError("Invalid escape char: " + esc);
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
                throw parsingError("Unexpected EOF when reading a definition.");
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
                throw parsingError("Unexpected EOF when reading a quotation.");
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

    let readList = () => {
        const col = getColumn();
        let innerCode = "";
        let parenDepth = 1;

        let c = read();

        while (parenDepth > 0) {
            if (c == EOF) {
                throw parsingError("Unexpected EOF when reading a list.");
            }

            if (c == '"') {innerCode += '"' + readString().text }
            if (c == "[") {parenDepth++;}
            if (c == "]") {
                parenDepth--;
                if (parenDepth == 0) {
                    break;
                }
            }

            innerCode += c;
            c = read();
        }

        const elementTokens = parse(innerCode, _context);
        const invalid = elementTokens.filter((t) => t instanceof Word || t instanceof Definition);
        for (var i in invalid) {
            const t = invalid[i];
            log("Invalid list token '" + t.lexeme + "' at column " + t.col + ".");
        }
        if (invalid.length > 0) {
            throw parsingError("Lists must contain only literals, found invalid token '" + invalid[0].lexeme + "'");
        }
        return new List(getColumn(), col, innerCode, elementTokens);
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
            } else if (c == '[') {
                tokens.push(readList());
            } else {
                throw parsingError("Invalid character '" + c + "' at " + (getColumn()));
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
        const abbr = {
            "string" : "s",
            "bool" : "b",
            "number" : "n",
            "quotation" : "q",
            "list" : "l",
            "object" : "o",
        };

        if (this.type in abbr) {return abbr[this.type]};
        return this.type;
    }

    toString() {
        if (this.type == "quotation") {
            return "q" + this.col;
        }

        //return this.shortType() + ":" + this.val;
        return this.toLiteral();
    }

    // Returns a string that returns the exact same value when evaluated.
    toLiteral() {
        if (this.type == "string") {
            return '"' + this.val + '"';
        } else if (this.type == "bool") {
            return this.val ? "1" : "0";
        } else if (this.type == "number") {
            return String(this.val);
        } else if (this.type == "quotation") {
            return '(' + this.val + ')';
        } else if (this.type == "list") {
            //return '[' + (this.val.map((x) => x.lexeme)).join(" ") + ']'
            //log("list: ", this.val);
            return '[' + this.val.map((x) => x.toLiteral()).join(" ") + ']'
        } else if (this.type == "object") {
            return JSON.stringify(this.val, null, 2);
        }
        return String(this.val);
    }

    clone() {
        let value = this.val;
        if (this.type == "list") {
            // FIXME this is only a shallow copy if we have js objects in the list
            value = this.val.slice();
        }

        return new Value(this.type, value, this.col);
    }
}


let runtimeError = function(msg) {
    console.trace(msg);
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
        if (v.type != type){throw runtimeError("Got value of type " + v.type + " instead of " + type + ": " + v)}
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

    let to_native = function(value) {
        if (!(value instanceof Value)) {
            throw "invalid type to to_native: " + typeof(value) + ", " + value
            return null;
        }

        if (value.type == "list") {
            return value.val.map(to_native);
        }

        if (value.type == "quotation") {
            return function () {
                for(var i = 0; i < arguments.length; i++) {
                    stack.push(from_native(arguments[i]));
                }
                //log("quotation call args: ", arguments);
                runQuotation(value);
                let output = pop();
                //log("output: ", output);
                return to_native(output);
            }

        }

        return value.val;
    }

    let from_native = function(in_value) {
        const types = {
            "get": function(prop) {
                return Object.prototype.toString.call(prop);
            },
            "object": "[object Object]",
            "array": "[object Array]",
            "string": "[object String]",
            "boolean": "[object Boolean]",
            "number": "[object Number]"
        }

        // log("type: " + types.get(in_value));

        switch (types.get(in_value)) {
            case types.object:
                return new Value("object", in_value, -1);
            case types.array:
                let boxed = in_value.map(from_native);
                return new Value("list", boxed, -1);
            case types.string:
                return new Value("string", in_value, -1);
            case types.boolean:
                return new Value("number", in_value ? 1 : 0, -1);
            case types.number:
                return new Value("number", in_value, -1);
        }

        throw "Unsupported native object: " + types.get(in_value)
        return null;
    }

    let builtinWords = {
        // dup
        "d" : () => {
            let a = pop();
            push(a);
            push(a);},
        // drop
        "x" : () => {
            pop();},
        // print
        "." : () => {output(pop().val)},
        // swap
        "s" : () => {
            let a = pop();
            let b = pop();
            stack.push(a);
            stack.push(b);
        },
        // rot
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
        // conditional
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
        // times
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
        // quotation invocation
        "i" : () => {
            let src = pop();
            type_assert("quotation", src);
            runQuotation(src);
        },
        // stack debug
        "å" : () => {
            output(stack);
        },
        // get
        "g" : () => {
            const index = pop();

            if (index.type == "number") {
                const list = pop();
                type_assert("list", list);

                const ind = Math.floor(index.val);

                if (ind < 0 || ind >= list.val.length) {
                    throw runtimeError("Index " + ind + " out of range.");
                }

                push(list);
                push(list.val[ind].clone());
            } else if (index.type == "string") {
                const obj = pop();
                type_assert("object", obj);

                const ind = to_native(index);

                if (!(ind in obj.val)) {
                    throw runtimeError("Index '" + ind + "' not in obj " + obj.val);
                }

                const result = obj.val[ind];
                push(obj);
                push(from_native(result));
            } else {
                throw runtimeError("Invalid index type " + index.type);
            }
        },
        // split TODO remove?
        "c" : () => {
            let separator = pop();
            let str = pop();
            type_assert("string", separator);
            type_assert("string", str);
            // log(separator);
            // log(str);
            let list = str.val.split(separator.val);
            // log(list);
            let stringified_list = (list.map((x) => new Value("string", x, str.col))).join(" ");
            // log(stringified_list);
            // TODO str.col is incorrect, should be actually position of "c"
            push(new Value("list", stringified_list, str.col));
        },
        // map
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
        // execute js code
        "_" : () => {
            const code = pop();
            type_assert("string", code);
            const this_arg = pop();
            const native_this = to_native(this_arg);

            let func = undefined;

            try {
                func = eval(code.val);
            } catch (e) {
                log("'" + code.val + "' not found, looking on 'this'", native_this)
                func = native_this[code.val];
            }


            const args = [];
            for (let i=0 ; i<func.length ; i++) {
                args.push(to_native(pop()));
            }

            // log("func: ", func);
            // log("args: ", args);

            let ret = func.apply(native_this, args);
            log("got from native call: " + ret);
            push(from_native(ret));
        }
    };

    //let words = in_words || {}; // FIXME don't use OR here
    let words = Object.assign({}, in_words, builtinWords);

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

            words[token.text]();
        } else if (token instanceof Definition) {
            if (token.name in builtinWords) {
                throw runtimeError("Trying to redefine builtin word at "+token.col+": " + token.name);
            }

            words[token.name] = () => execute(token.tokens, outputCallback, words, stack);

        } else if (token instanceof List) {
            const elementValues = [];
            for (const t of token.elements) {
                const temp_stack = []
                //log("elems: ", t);
                execute([t], outputCallback, words, temp_stack);
                // Lists are allowed only contain single literals so there should be a single value.
                elementValues.push(temp_stack[0]);
                //log("first: ", temp_stack[0]);
            }
            stack.push(new Value("list", elementValues, token.col));
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


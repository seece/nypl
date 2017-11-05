"use strict";
var util = require("util");
var fuse = require("fuse.js");
var exports = module.exports = {};

var log = console.log;

let runtimeError = function(msg) {
    console.trace(msg);
    return "runtimeError: " + msg;
}

let checkType = function(type, obj) {
    let actual = Object.prototype.toString.call(obj).toLowerCase();
    return actual === '[object '+type+']';
}

let assertType = function(type, obj) {
    let actual = Object.prototype.toString.call(obj).toLowerCase();
    if (!checkType(type, obj)){throw runtimeError("Got value of type " + actual + " instead of " + type + ": " + obj)}
}

var makeRunContext = function(stack, variables, outputCallback, exec) {
    let currentCall = "";
    let pop = () => {
        if (stack.length == 0) {
            throw runtimeError("Stack underflow at '"+currentCall+"'!");
        }
        return stack.pop();
    }

    let push = (a) => {
        stack.push(a);
    }

    let output = outputCallback || ((obj) => {
        console.log(">> ", obj);
    });

    let builtins = {
        // dup
        "d" : () => {
            let a = pop();
            push(a);
            push(a);},
        // drop
        "x" : () => {
            pop();},
        // print
        "." : () => {output(pop())},
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
            stack.push(a+b);},
        "-" : () => {
            let a = pop();
            let b = pop();
            assertType("number", a);
            assertType("number", b);
            stack.push(b - a);},
        "/" : () => {
            let a = pop();
            let b = pop();
            assertType("number", a);
            assertType("number", b);
            stack.push(b / a);},
        "%" : () => {
            let a = pop();
            let b = pop();
            assertType("number", a);
            assertType("number", b);
            stack.push(b % a);},
        "*" : () => {
            let a = pop();
            let b = pop();
            assertType("number", a);
            assertType("number", b);
            push(a*b)},
        "=" : () => {
            let a = pop();
            let b = pop();
            stack.push(a == b);},
        "<" : () => {
            let a = pop();
            let b = pop();
            stack.push(b < a);},
        ">" : () => {
            let a = pop();
            let b = pop();
            stack.push(b > a);},
        "!" : () => {
            let a = pop();
            push(!a);},
        "?" : () => {
            let else_func = pop();
            let then_func = pop();
            let if_func = pop();
            assertType("array", if_func);
            assertType("array", then_func);
            assertType("array", else_func);
            exec(if_func);
            let result = pop();
            if (result) {
                exec(then_func);
            } else {
                exec(else_func);
            }
        },
        // times
        "t" : () => {
            let src = pop();
            let amt = pop();
            assertType("number", amt);
            assertType("array", src);
            let times = amt.val;
            while (times > 0) {
                times--;
                exec(new_prog);
            }
        },
        // quotation invocation
        "i" : () => {
            let src = pop();
            assertType("array", src);
            exec(src);
        },
        // stack debug
        "å" : () => {
            output(stack);
        },
        // get
        "g" : () => {
            const index = pop();
            const list = pop();
            push(list);
            if (!variables.hasOwnProperty(index)) {
                throw runtimeError("Object has no index '"+index+"'!");
            }
            const value = list[index];
            push(value);
        },
    }

    let o = {
        call: (name) => {
        currentCall = name;
        if (variables.hasOwnProperty(name)) {
            return exec(variables[name]);
        }
        return builtins[name]();
    },
        makeStore: (name) => {
            let f = () => {
                let value = pop();
                // Literals stored in a variable are wrapped in a list
                // in order to execute them in the call function above.
                if (!checkType("array", value)) {
                    value = [value];
                }
                variables[name] = value;
            };

            f.toString = () => {return "Store: '"+name+"'"};

            return f;
        }
    }

    return Object.assign(o, {"builtins": builtins});
}

var parse = function(code, ctx, _debugpos) {
    let pos = 0; // points to the next character to be read
    const EOF = -1;
    let debugpos = _debugpos || {"offset" : 0};

    let getColumn = () => {
        return debugpos.offset + pos-1;
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

        return parseFloat(digit);
    }

    let readCall = () => {
        let name = getLast();
        let f = () => {
            log("stub: calling word '" + name + "'");
            ctx.call(name);
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

    let readStore = () => {
        let variable = read();
        return ctx.makeStore(variable);
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
                tokens.push(readStore());
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

let execute = function(prog, outputCallback, externals, words, stack, indent) {
    let output = outputCallback || ((obj) => {
        console.log(">> ", obj);
    })

    let pc = 0;
    while (pc < prog.length) {
        let value = prog[pc];
        pc++;

        const types = {
            "get": function(prop) {
                return Object.prototype.toString.call(prop);
            },
            "object": "[object Object]",
            "array": "[object Array]",
            "string": "[object String]",
            "boolean": "[object Boolean]",
            "number": "[object Number]",
            "function": "[object Function]"
        }

        /*switch (types.get(value)) {
            case types.array:
                stack.push(value);
            case types.string:
                stack.push(value);
            case types.number:
                stack.push(value);
            case types.number:
                stack.push(value);
        }*/

        if (types.get(value) === types.function) {
            log("running: " + value);
            value();
        } else {
            stack.push(value);
        }
    }
}

let run = function(code, cb, extfuncs, variables, stack) {
    log("got code: " + code);

    let ctx = makeRunContext(stack, variables, cb, (prog)=>
        {execute(prog, cb, extfuncs, variables, stack)}
    );
    let program = parse(code, ctx);
    log("program: " + program);

    execute(program, cb, extfuncs, variables, stack);

    return stack;
}

exports.parse = parse;
exports.execute = execute;
exports.run = run;


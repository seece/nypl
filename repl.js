"use strict";
var nypl = require('./interpreter.js');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.historyIndex = 0
rl.history = ['App.Post.all()']

rl.on('attemptClose',rl.close);

let words = {};
let stack = [];

let extfuncs = {
    test: (s) => {return "test got "+s+"";}
}

let ask = function() {
    rl.question('>', (answer) => {
        try {
            var result = nypl.run(answer, (msg) => console.log("    > ", msg), extfuncs, words, stack);
            it.next(result);
        } catch (e) {
            it.next(e);
        }
    });
}

function *repl() {
    while(true) {
        let result = yield ask();
        console.log("Stack: ", result.toString());
    }
}


var it = repl();
it.next();


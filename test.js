"use strict";
var nypl = require('./interpreter.js');


let assert = function(expr, msg) {if (!expr) {throw msg;}};
let assertEqual = function(val, expected) {
    if (val != expected) {throw "Expected " + expected + " but got " + val + "!";}
};

let run = function(code) {
    let words = {};
    let stack = [];
    return nypl.run(code, (msg) => console.log(">> ", msg), words, stack);
}

{
const result = run('(xx2+) [ 1 2 3 ] "map" _')
assertEqual(result[0].type, 'list')
assertEqual(result[0].val.length, 3)
assertEqual(result[0].val[0].val, 3)
}

{
const result = run('0 "()=>{return {\\"a\\":5}}" _ "a" g')
assertEqual(result[1].type, 'number')
assertEqual(result[1].val, 5)}

{
const result = run('[1 2 3] u 3 w')
assertEqual(result[0].type, 'list')
assertEqual(result[0].val[0].val, 1);
assertEqual(result[0].val[2].val, 3);
}

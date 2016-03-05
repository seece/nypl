// browserify webnypl.js -o web.js
"use strict";
global.nypl = require('./interpreter');
global.inspect = require('util').inspect;


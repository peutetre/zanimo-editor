#!/usr/bin/env node

var preprocess = require('preprocess');
var argv = process.argv.slice(2);

preprocess.preprocessFileSync(
    './env/index.tmpl',
    './env/index.js',
    {
        TARGET: argv[0]
    }
);

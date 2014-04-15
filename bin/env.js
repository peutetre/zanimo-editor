#!/usr/bin/env node

var preprocess = require('preprocess');

preprocess.preprocessFileSync(
    './env/index.tmpl',
    './env/index.js',
    {
        TARGET: process.argv.slice(2)[0]
    }
);

#!/usr/bin/env node

var preprocess = require('preprocess');

preprocess.preprocessFileSync(
    './www/index.tmpl',
    './www/index.html', 
    {
        ZANIMO_ENV: process.argv.slice(2)[0]
    }
);

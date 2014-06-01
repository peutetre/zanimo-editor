#!/usr/bin/env node

var preprocess = require('preprocess');
var argv = process.argv.slice(2);

preprocess.preprocessFileSync(
    './www/index.tmpl',
    './www/index.html', 
    {
        ZANIMO_ENV: argv[0],
        IS_WP8: argv[1] ? true : false
    }
);

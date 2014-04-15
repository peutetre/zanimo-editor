#!/usr/bin/env node

var preprocess = require('preprocess');

preprocess.preprocessFileSync(
    './www/manifest.appcache.tmpl',
    './www/manifest.appcache', 
    {
        D:(new Date())
    }
);

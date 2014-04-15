#!/usr/bin/env node

var preprocess = require('preprocess'),
    pkg = require('../package.json');

preprocess.preprocessFileSync(
    './app/config.tmpl',
    './app/config.xml',
    {
        BUNDLE_ID: process.argv.slice(2)[0],
        VERSION: pkg.version
    }
);

#!/usr/bin/env node

var fs = require('fs'),
    rimraf = require('rimraf');

rimraf('./app/www', function (err) {
    if(err) process.exit(2);
    fs.symlink('../www', './app/www', 'dir', function (err) {
        if (err) { process.exit(4); }
    });
});

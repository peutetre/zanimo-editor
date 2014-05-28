#!/usr/bin/env node

require('rimraf')('./app/www', function (err) {
    if(err) process.exit(2);
});

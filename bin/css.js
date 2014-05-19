#!/usr/bin/env node

var rimraf = require('rimraf'),
	fs = require('fs'),
	stylus = require('stylus');

var styl = fs.readFileSync('styl/style.styl', 'utf-8');

rimraf('www/css/style.css', function (err) {
	if(err) process.exit(2);
	else {
		stylus.render(styl, function(err, css) {
  			if (err) process.exit(3);
  			fs.writeFileSync('www/css/style.css', css);
		});
	}
});
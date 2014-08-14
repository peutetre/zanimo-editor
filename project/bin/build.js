/*
 * build.js
 */

var browserify = require('browserify'),
    Q = require('q'),
    preprocess = require('preprocess'),
    path = require('path'),
    fs = require('fs'),
    tmp = require('tmp'),
    rimraf = require('rimraf'),
    stylus = require('stylus');

function mapSettings(settings, platform, configurationName) {
    var mapping = require('./mapping');
    var result = {};
    var flatSettings = {};

    for (var k in settings) {
        if (k !== "configurations") {
            flatSettings[k] = settings[k];
        } else {
            for (var l in settings[k][platform][configurationName]) {
                flatSettings[l] = settings[k][platform][configurationName][l];
            }
        }
    }

    for (var j in flatSettings) {
        if (mapping[j] !== undefined) {
            result[mapping[j]] = flatSettings[j];
        }
    }

    return result;
}

function style() {
    var styl_path = path.join(__dirname, '../styl/style.styl'),
        output_path = path.join(__dirname, '../www/css/style.css'),
        styl = fs.readFileSync(styl_path, 'utf-8'),
        defer = Q.defer();

    rimraf(output_path, function (err) {
        if(err) defer.reject(err);
        else {
            stylus.render(styl, function(err, css) {
                if (err) defer.reject(err);
                fs.writeFileSync(output_path, css);
                defer.resolve();
            });
        }
    });
    return defer.promise;
}

module.exports = function build(platform, settings, configurationName, verbose) {
    var b = browserify();
    var defer = Q.defer();
    var output = path.join(__dirname, '../www/main.js');

    if(fs.existsSync(output)) fs.unlinkSync(output);

    var ws = fs.createWriteStream(path.join(__dirname, '../www/main.js'));

    tmp.file({ prefix: 'settings-', postfix: '.json' },function (err, tmpFilePath) {
        if (err) defer.reject(err);
        fs.writeFileSync(tmpFilePath, JSON.stringify(mapSettings(settings, platform, configurationName), null, 2));

        b.add(path.join(__dirname, '../lib/app.js'))
            .require(tmpFilePath, { expose : 'settings' })
            .bundle()
            .pipe(ws);

        ws.on('finish', function() {
            tmp.setGracefulCleanup();
            var htmlSrc = path.join(__dirname, '../html/index.html');
            var htmlDest = path.join(__dirname, '../www/index.html');
            preprocess.preprocessFileSync(htmlSrc, htmlDest, {
                PLATFORM : platform
            });
            preprocess.preprocessFileSync(
                path.join(__dirname, '../html/manifest.appcache'),
                path.join(__dirname, '../www/manifest.appcache'),
                { D:(new Date()) }
            );
            style().then(function () {
                if(verbose)
                    console.log('✔ www project build done with configuration ' + configurationName + '!');
                defer.resolve();
            });
        });
    });
    return defer.promise;
};

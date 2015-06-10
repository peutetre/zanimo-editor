/*
 * build.js
 */

var browserify = require('browserify'),
    watchify = require('watchify'),
    Q = require('q'),
    path = require('path'),
    fs = require('fs'),
    chokidar = require('chokidar'),
    stylus = require('stylus'),
    preprocess = require('preprocess'),
    rimraf = require('rimraf'),

    w, // watchify instance
    watcher, // chokidar watcher instance
    watcherStyl, // chokidar stylus folder watcher instance
    watcherHTML, // chokidar html folder watcher instance

    src = path.join(__dirname, '../lib/app.js'),
    settings = path.join(__dirname, 'settings.json'),
    out = path.join(__dirname, '../www/main.js'),
    www = path.join(__dirname, '../www');

function log(s) {
    return function log(o) { if(o) console.log('- ' + s + ' - ' + o); };
}

function rejectOnError(d) {
    return function (err) { log(err); if(err) d.reject(err); };
}

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

function style(b) {
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
                log('style')('done');
                defer.resolve(b);
            });
        }
    });
    return defer.promise;
}

function bundle(conf) {
    var defer = Q.defer(),
        b = browserify({ cache: {}, packageCache: {}, fullPaths: true });

    if(fs.existsSync(settings)) fs.unlinkSync(settings);
    if(fs.existsSync(out)) fs.unlinkSync(out);

    fs.writeFileSync(settings, JSON.stringify(conf), null, 2);

    var ws = fs.createWriteStream(out);

    b.add(src)
        .exclude('settings')
        .require(settings, { expose : 'settings' })
        .bundle(rejectOnError(defer))
        .pipe(ws);

    ws.on('finish', function() { ws.end(); log('browserify')('done'); defer.resolve(b); });

    return defer.promise;
}

function html(platform) {
    return function (b) {
        preprocess.preprocessFileSync(
            path.join(__dirname, '../html/index.html'),
            path.join(__dirname, '../www/index.html'),
            { PLATFORM : platform }
        );
        log('html')('done');
        return Q(b);
    }
}

function appCache (b) {
    preprocess.preprocessFileSync(
        path.join(__dirname, '../html/manifest.appcache'),
        path.join(__dirname, '../www/manifest.appcache'),
        { D:(new Date()) }
    );
    log('appCache')('done');
    return Q(b);
}

module.exports.build = function build(platform, localSettings, config) {
    return bundle(mapSettings(localSettings, platform, config))
        .then(style)
        .then(html(platform))
        .then(appCache);
};

function run(conf, f){
    return bundle(conf).then(function (b) {
        var w = watchify(b);
        b.bundle(function () { w.on('log', log); });

        w.on('update', function () {
            var ws = fs.createWriteStream(out);

            w.bundle(log('browserify')).pipe(ws);

            ws.on('finish', function() { ws.end(); log('browserify')('done'); f(out); });
        });
        return w;
    });
}

function runStyle(f) {
    return function (bw) {
        return style(bw).then(function (b) {
            watcherStyl = chokidar.watch(path.join(__dirname, '../styl'), {
                persistent: true
            });
            setTimeout(function () {
                watcherStyl.on('all', function (evt, p) {
                    style().then(appCache).then(function () {
                        f(p);
                    });
                });
            }, 4000);
            return b;
        });
    };
}

function runHtml(platform, f) {
    return function (bw) {
        return html(platform)(bw).then(function (b) {
            watcherHTML = chokidar.watch(path.join(__dirname, '../html'), {
                persistent: true
            });
            setTimeout(function () {
                watcherHTML.on('all', function (evt, p) {
                    html(platform)().then(appCache).then(function () {
                        f(p);
                    });
                });
            }, 4000);
            return b;
        });
    };
}

module.exports.watch = function watch(f, localSettings, platform, config, confEmitter) {
    run(mapSettings(localSettings, platform, config), f)
        .then(runStyle(f))
        .then(runHtml(platform, f))
        .then(appCache)
        .then(function (bw) {
            watcher = chokidar.watch(www, {
                ignored: /main\.js|index\.html|style\.css|manifest\.appcache/,
                persistent: true
            });

            setTimeout(function () {
                watcher.on('all', function (evt, p) { appCache(); f(p); });
            }, 4000);

            confEmitter.on('change', function (conf) {
                fs.writeFileSync(settings, JSON.stringify(conf), null, 2);
            });
    });
};

module.exports.close = function () {
    if(w) w.close();
    if(watcher) watcher.close();
    if(watcherStyl) watcherStyl.close();
    if(watcherHTML) watcherHTML.close();
};

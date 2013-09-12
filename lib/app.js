/*
 * app.js - the Zanimo animation editor
 */

"use strict";


var Q = require('q'),
    qstart = require('qstart'),

    $ = require('./$'),
    curtain = require('./curtain'),
    dataStore = require('./dataStore'),
    editor = require('./editor'),
    user = require('./user'),
    runner = require('./runner'),
    notification = require('./notification'),
    route = require('./route'),
    assets = require('./assets'),
    gists = require('./gists'),
    fixLayout = require('./fixLayout'),

    app = {};

app.openCurtain = function () {
    return Q.delay(300).then(curtain.animate).then(curtain.bind);
};

/*
 * app actions
 */

app.onActionOAuthRedirect = function (match) {
    return app
        .openCurtain()
        .then(function () { return user.onOAuthRedirect(match); })
        .then(editor.showLogoutBtn);
};

app.onActionRunner = function (match) {
    return gists
        .fetchGistFromUrl(match)
        .then(editor.setScript)
        .then(runner.run)
        .then(app.openCurtain)
        .then(user.init, function () {
            return app
                .openCurtain()
                .then(notification.failƒ("✗ Oops! Gist doesn't exist...", 1000))
                .then(user.init);
        })
        .then(editor.showLogoutBtn);
};

app.onActionDefault = function () {
    return app
        .openCurtain()
        .then(user.init)
        .then(editor.showLogoutBtn);
};

app.init = function () {
    return curtain.init()
        .then(dataStore.init)
        .then(notification.init)
        .then(runner.init)
        .then(editor.init)
        .then(fixLayout)
        .then(assets.init)
        .then(route({
            "\\?code=([a-z0-9]*)" : app.onActionOAuthRedirect,
            "\\?gist=([a-z0-9]*)" : app.onActionRunner,
            "" : app.onActionDefault
        }));
};

qstart
    .then(app.init)
    .fail(function (err) {
        console.log(err, err.stack);
    });

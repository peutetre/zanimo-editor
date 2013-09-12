// # the Zanimo editor

"use strict";

// ### import npm modules
var Q = require('q'),
    qstart = require('qstart'),
// import all local modules
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
// The main app object
    app = {};
// Open the curtain and bind touch/clich events
app.openCurtain = function () {
    return Q.delay(300).then(curtain.animate).then(curtain.bind);
};

// ### defining all app actions
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

// initialize all modules
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

// Start the application when the DOM is ready
// and log eventual errors
qstart
    .then(app.init)
    .fail(function (err) {
        console.log(err, err.stack);
    });

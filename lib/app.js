/*
 * app.js - the Zanimo editor
 */

"use strict";

var Q = require('q'),
    qstart = require('qstart'),
    Mask = require('mask'),

    $ = require('./$'),
    appcache = require('./appcache'),
    curtain = require('./curtain'),
    data = require('./data'),
    editor = require('./editor'),
    user = require('./user'),
    runner = require('./runner'),
    notification = require('./notification'),
    alert = require('./overlays/alert'),
    prompt = require('./overlays/prompt'),
    confirm = require('./overlays/confirm'),
    route = require('./route'),
    layout = require('./layout'),
    softkeyboard = require('./softkeyboard'),

    app = {};

app.openCurtain = function () {
    return Q.delay(300).then(curtain.animate).then(curtain.bind);
};

app.onActionOAuthRedirect = function (match) {
    return app
        .openCurtain()
        .then(function () { return user.onOAuthRedirect(match); })
        .then(data.syncƒ)
        .then(editor.refreshSelect)
        .then(editor.showLogoutBtn);
};

app.onActionRunner = function (match) {
    return editor.importGistAsLocalScript(match[1])
        .then(runner.run)
        .then(app.openCurtain)
        .then(user.init, function (err) {
            return app
                .openCurtain()
                .then(notification.failƒ($.formatError(err)))
                .then(user.init);
        })
        .then(data.syncƒ)
        .then(editor.refreshSelect)
        .then(editor.showLogoutBtn);
};

app.onActionDefault = function () {
    return app
        .openCurtain()
        .then(function () {
            alert.show(
                'Welcome to Zanimo Editor',
                $.$("#welcome-content").innerHTML
            );
        })
        .then(user.init)
        .then(data.syncƒ)
        .then(editor.refreshSelect)
        .then(editor.showLogoutBtn);
};

app.init = function () {
    return curtain.init()
        .then(Mask.init)
        .then(softkeyboard.init)
        .then(alert.init)
        .then(prompt.init)
        .then(confirm.init)
        .then(data.init)
        .then(notification.init)
        .then(runner.init)
        .then(editor.init)
        .then(layout)
        .then(appcache.update)
        .then(app.hideSplashscreen)
        .then(route({
            "\\?code=([a-z0-9]*)" : app.onActionOAuthRedirect,
            "\\?gist=([a-z0-9]*)" : app.onActionRunner,
            "" : app.onActionDefault
        }));
};

app.hideSplashscreen = function (arg) {
    if (cordova) setTimeout(navigator.splashscreen.hide, 2000);
    return arg;
};

if(cordova) {
    window.document.addEventListener('deviceready', app.init);
}
else {
    qstart
        .then(app.init)
        .fail(function (err) {
            if (err.toString() != '✗ user not logged...') {
                notification.fail($.formatError(err));
            }
            console.log("Error:", err, "Stack:", err.stack);
        });
}

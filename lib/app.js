/*
 * app.js - the Zanimo animation editor
 */

"use strict";

var app = {},
    VERSION = 25,
    Q = require('q'),
    qstart = require('qstart'),
    _$ = require('./$'),
    curtain = require('./curtain'),
    store = require('./store'),
    editor = require('./editor'),
    user = require('./user'),
    runner = require('./runner'),
    notification = require('./notification'),
    route = require('./route'),
    assets = require('./assets'),
    $imgContainer = null;

// fix layout when no CSS calc() support available
function fixCSSCalc() {
    var dummy = _$.DOM("div"), calc = null;

    ["", "-webkit-", "-moz-", "-ms-"].forEach(function (prefix) {
        var t = prefix + "calc(10px)";
        dummy.style.cssText = "width:" + t + ";";
        if(dummy.style.width === t) calc = prefix + "calc";
    });

    if (calc !== null) return;

    var $doc = _$.$(".documentation section.content"),
        $content = _$.$(".documentation section.content div.doc-content"),
        $editor = _$.$(".CodeMirror"),
        fixLayout = function () {
            var h = _$.getViewportHeight();
            $doc.style.height = (h - 30) + "px";
            $content.style.height = (h - 65) + "px";
            if($editor) $editor.style.height = (h - 80) + "px";
        };
    if(!_$.isTouchable) window.addEventListener("resize", fixLayout);
    window.addEventListener("orientationchange", fixLayout);
    fixLayout();
}

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
    if(editor.add(match[2], window.atob(match[3])))
        runner.run(editor.getValue());
};

app.onActionDefault = function () {
    return app
        .openCurtain()
        .then(user.init)
        .then(editor.showLogoutBtn);
};

app.init = function () {
    curtain.init();
    notification.init();
    store.setup(VERSION);
    runner.init();
    editor.init();
    fixCSSCalc();
    $imgContainer = _$.$(".documentation div.imgs");
    assets.get("https://api.travis-ci.org/peutetre/Zanimo.png?branch=master", $imgContainer);
    assets.get("https://saucelabs.com/browser-matrix/peutetre.svg", $imgContainer, "sauce");
    return route({
        "\\?code=([a-z0-9]*)" : app.onActionOAuthRedirect,
        "\/#\/(runner)\\\/(\\w+)\\\/(\\w+)" : app.onActionRunner,
        "" : app.onActionDefault
    });
};

qstart.then(app.init);

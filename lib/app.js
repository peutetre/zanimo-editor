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
    runner = require('./runner');

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

app.share = function () { editor.onShare(); };

app.show = function () {
     var hash = window.location.hash.replace(/#/, ''),
        matchRoute = hash.match(/(runner)\/(\w+)\/(\w+)/);

    switch ( matchRoute ? matchRoute[1] : "" ) {
        case "runner":
            if (editor.add(matchRoute[2], window.atob(matchRoute[3])))
                runner.run(editor.getValue());
        default:
            window.location.hash = "";
            Q.when(Q.delay(1000), function () {
                curtain.animate().then(curtain.bind)
            });
    }
};

app.init = function () {
    curtain.init();
    store.setup(VERSION);
    runner.init();
    editor.init();
    fixCSSCalc();
    app.show();
};

qstart().then(app.init);

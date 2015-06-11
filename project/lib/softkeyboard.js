/*
 * softkeyboard.js - hide softkeyboard
 */

"use strict";

var $ = require('./$'),
    softkeyboard = {},
    Zanimo = require('zanimo'),
    a = null,
    keyboradPusher = null;

function fixUpEditor(e) {
    Zanimo(keyboradPusher, 'height', 'calc( 100% - 80px - ' + e.keyboardHeight + 'px )');
}

function fixDownEditor(e) {
    Zanimo(keyboradPusher, 'height', 'calc( 100% - 80px )');
}

softkeyboard.init = function () {
    a = $.DOM('a');
    a.href = "#";
    a.id = "hidden-a";
    window.document.body.appendChild(a);

    keyboradPusher = $.$('textarea');

    if (cordova.platformId === 'ios') {
        window.addEventListener('native.keyboardshow', fixUpEditor);
        window.addEventListener('native.keyboardhide', fixDownEditor);
    }
};

softkeyboard.hide = function () { if (a) a.focus(); };

module.exports = softkeyboard;

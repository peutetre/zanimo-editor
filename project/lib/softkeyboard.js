/*
 * softkeyboard.js - hide softkeyboard
 */

"use strict";

var $ = require('./$'),
    softkeyboard = {},
    a = null;

softkeyboard.init = function () {
    a = $.DOM('a');
    a.href = "#";
    a.id = "hidden-a";
    window.document.body.appendChild(a);
};

softkeyboard.hide = function () { if (a) a.focus(); };

module.exports = softkeyboard;

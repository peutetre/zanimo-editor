/*
 * $.js - utils
 */

"use strict";

var isMobile = /WebKit.*Mobile.*|Android/.test(navigator.userAgent);

exports.$ = function $(s, c) { return (c || window.document).querySelector(s); }
exports.$$ = function $$(s, c) { return (c || window.document).querySelectorAll(s); }
exports.DOM = function DOM(tag) { return window.document.createElement(tag); }
exports.empty = function empty() { }
exports.isTouchable = window.document.ontouchstart === null;
exports.isMobile = isMobile;
exports.getViewportHeight = function () { return isMobile ? window.outerHeight : window.innerHeight };


exports.formatError = function (err) {
    // is xhr error
    if(err.error && err.request) return "✗ " + err.error + " " + err.request.statusText;
    if(err.error == 0 && err.request) return "✗ Network unavailble";
    return err;
};

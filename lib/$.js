/*
 * $.js - utils
 */

"use strict";

var isMobile = /WebKit.*Mobile.*|Android|IEMobile/.test(navigator.userAgent);

exports.$ = function $(s, c) { return (c || window.document).querySelector(s); }
exports.$$ = function $$(s, c) { return (c || window.document).querySelectorAll(s); }
exports.DOM = function DOM(tag) { return window.document.createElement(tag); }
exports.empty = function empty() { }
exports.isTouchable = window.document.ontouchstart === null;
exports.isMobile = isMobile;
exports.getViewportHeight = function () { return isMobile ? window.outerHeight : window.innerHeight };

exports.detect = {
    firefox : navigator.userAgent.match(/Firefox\/([\d.]+)/),
    ios : navigator.userAgent.match(/iPhone|iPad|iPod/),
    android : navigator.userAgent.match(/Android/)
};

exports.formatError = function (err) {
    // is xhr error
    if(err.error && err.request) return "✗ " + err.error + " " + err.request.statusText;
    if(err.error == 0 && err.request) return "✗ Network unavailble";
    if(err.statusText && err.status === 0) return "✗ Network unavailble";

    return err;
};
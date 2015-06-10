/*
 * $.js - utils
 */

"use strict";

var Q = require('q');

var isMobile = /WebKit.*Mobile.*|Android|IEMobile/.test(navigator.userAgent);
var isWPCordova = window.cordova && window.cordova.platformId === "windowsphone";

exports.$ = function $(s, c) { return (c || window.document).querySelector(s); }
exports.$$ = function $$(s, c) { return (c || window.document).querySelectorAll(s); }
exports.DOM = function DOM(tag) { return window.document.createElement(tag); }
exports.empty = function empty() { }
exports.isTouchable = window.document.ontouchstart === null;
exports.isMobile = isMobile;
exports.isWPCordova = isWPCordova;

exports.getViewportHeight = function () {
    var d = Q.defer(),
        inner = window.innerHeight,
        outer = window.outerHeight;

    if(isWPCordova) d.resolve(inner);
    else d.resolve(isMobile ? (outer || inner) : inner);

    return d.promise;
};

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

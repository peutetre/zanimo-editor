/*
 * gists.js
 */

"use strict";

var Q = require('q'),

    gists = {};

gists.fetchGistFromUrl = function (match) {
    console.log("gists.fetchGistFromUrl", match);
    history.pushState("", document.title, window.location.pathname);
    return Q.reject("Oops");
};

module.exports = gists;

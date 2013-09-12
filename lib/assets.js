/*
 * assets.js - manage assets
 */

"use strict";

var QImage = require('qimage'),
    $ = require('./$'),

    assets = {};

function get (ressource, anchor, cls) {
    return QImage(ressource)
        .then(function (img) {  if(cls) { img.className = cls; } return img; })
        .then(function (img) { anchor.appendChild(img); return img; });
}

assets.init = function () {
    var $imgContainer = $.$(".documentation div.imgs");
    get("https://api.travis-ci.org/peutetre/Zanimo.png?branch=master", $imgContainer);
    get("https://saucelabs.com/browser-matrix/peutetre.svg", $imgContainer, "sauce");
};

module.exports = assets;

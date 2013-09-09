/*
 * assets.js - manage assets
 */

"use strict";

var assets = {},
    QImage = require('qimage');

assets.get = function (ressource, anchor, cls) {
    return QImage(ressource)
        .then(function (img) {  if(cls) { img.className = cls; } return img; })
        .then(function (img) { anchor.appendChild(img); return img; });
};

module.exports = assets;

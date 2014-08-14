/*
 * data/publicgist.js
 */

"use strict";

var gist = require('./gist'),
    publicgist = {};

publicgist.create = function (name, val) {
    return gist.create(name, val, true);
};

publicgist.first = function () {
    return gist.first(true);
};

publicgist.list = function () {
    return gist.list(true);
};

publicgist.save = gist.save;
publicgist.del = gist.del;
publicgist.get = gist.get;
publicgist.getId = gist.getId;

module.exports = publicgist;

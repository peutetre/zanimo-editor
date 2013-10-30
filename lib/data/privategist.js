/*
 * data/privategist.js
 */

"use strict";

var gist = require('./gist'),
    privategist = {};

privategist.create = function (name, val) {
    return gist.create(name, val, false);
};

privategist.first = function () {
    return gist.first(false);
};

privategist.list = function () {
    return gist.list(false);
};

privategist.save = gist.save;
privategist.del = gist.del;
privategist.get = gist.get;
privategist.getId = gist.getId;

module.exports = privategist;

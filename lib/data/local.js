/*
 * data/local.js
 */

var Q = require('q'),
    collection = require('./localcollection'),
    storage = window.localStorage,
    local = {};

local.init = function () {
    return collection.init("zae-", "zanimo-editor-local-index");
};

local.create = function (name, val) {
    return collection.set(name, val);
};

local.save = function (name, val) {
    return collection.set(name, val);
};

local.del = function (name) {
    return collection.del(name);
};

local.first = function () {
    return collection.first().then(function (rst) {
        return rst;
    }, function(err) {
        return Q.reject("✗ No script available...");
    });
};

local.list = function () {
    return collection.list();
};

local.get = function (name) {
    return collection.get(name);
};

module.exports = local;

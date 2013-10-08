/*
 * data/local.js
 */

var Q = require('q'),
    collection = require('./localcollection'),
    _localcollection = null,
    local = {};

local.init = function () {
    _localcollection = collection("zae-", "zanimo-editor-local-index");
    return Q.resolve(_localcollection);
};

local.create = function (name, val) {
    return _localcollection.set(name, val);
};

local.save = function (name, val) {
    return _localcollection.set(name, val);
};

local.del = function (name) {
    return _localcollection.del(name);
};

local.first = function () {
    return _localcollection.first().then(function (rst) {
        return rst;
    }, function(err) {
        return Q.reject("✗ No script available...");
    });
};

local.list = function () {
    return _localcollection.list();
};

local.get = function (name) {
    return _localcollection.get(name);
};

module.exports = local;

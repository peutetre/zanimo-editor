/*
 * data/local.js
 */

var Q = require('q'),
    storage = window.localStorage,
    local = {},
    prefix = "zae-",
    indexKey = "zanimo-editor-local-index";

function list() {
    return JSON.parse(storage.getItem(indexKey));
}

function addToIndex(name) {
    var elts = list();
    if(elts.indexOf(name) == -1) {
        elts.push(name);
        storage.setItem(indexKey, JSON.stringify(elts));
    }
}

local.init = function () {
    if (!storage.getItem(indexKey)) storage.setItem(indexKey, '[]');
    return Q.resolve(true);
};

local.create = function (name, val) {
    storage.setItem(prefix+name, val);
    addToIndex(name);
    return Q.resolve(name);
};

local.save = function (name, val) {
    storage.setItem(prefix+name, val);
    return Q.resolve(name);
};

local.del = function (name) {
    storage.removeItem(prefix+name);
    storage.setItem(indexKey, JSON.stringify(list().filter(function (el) {
        return el !== name;
    })));
    return Q.resolve(name);
};

local.first = function () {
    var el = list()[0];
    return el ? Q.resolve(el) : Q.reject("✗ No script available...");
};

local.list = function () {
    return Q.resolve(list());
};

local.get = function (name) {
    return Q.resolve(storage.getItem(prefix+name));
};

module.exports = local;

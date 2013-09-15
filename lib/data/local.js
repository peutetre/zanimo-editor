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

function add(name) {
    var elts = list();
    elts.push(name);
    storage.setItem(indexKey, JSON.stringify(elts));
}

local.init = function () {
    if (!storage.getItem(indexKey))
        storage.setItem(indexKey, '[]');
    return Q(true);
};

local.create = function (name, val) {
    storage.setItem(prefix+name, val);
    add(name);
    return Q(name);
};

local.save = function (name, val) {
    storage.setItem(prefix+name, val);
};

local.del = function (name) {
    storage.removeItem(prefix+name);
    storage.setItem(indexKey, JSON.stringify(list().filter(function (el) {
        return el !== name;
    })));
};

local.first = function () {
    return list()[0];
};

local.list = function () {
    return list();
};

local.get = function (name) {
    return storage.getItem(prefix+name);
};

module.exports = local;

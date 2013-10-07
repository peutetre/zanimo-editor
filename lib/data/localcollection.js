/*
 * data/localcollection.js
 */

var Q = require('q'),
    storage = window.localStorage,
    prefix = null,
    indexKey = null,
    localcollection = {},

    _addToLocalIndex = function (name) {
        var elts = JSON.parse(storage.getItem(indexKey));
        if(elts.indexOf(name) == -1) {
            elts.push(name);
            storage.setItem(indexKey, JSON.stringify(elts));
        }
    },
    _rmFromLocalIndex = function (name) {
        var elts = JSON.parse(storage.getItem(indexKey)),
            filteredElts = elts.filter(function (el) { return el !== name; });
        storage.setItem(indexKey, JSON.stringify(filteredElts));
    };

localcollection.init = function (id, key) {
    prefix = id;
    indexKey = key;
    if (!storage.getItem(indexKey)) storage.setItem(indexKey, '[]');
    return Q.resolve(true);
};

localcollection.set = function (name, item) {
    storage.setItem(prefix+name, item);
    _addToLocalIndex(name);
    return Q.resolve(name);
};

localcollection.del = function (name) {
    storage.removeItem(prefix+name);
    _rmFromLocalIndex(name);
    return Q.resolve(name);
};

localcollection.get = function (name) {
    return Q.resolve(storage.getItem(prefix+name));
};

localcollection.list = function () {
    return Q.resolve(JSON.parse(storage.getItem(indexKey)));
};

localcollection.first = function () {
    var el = JSON.parse(storage.getItem(indexKey))[0];
    return el ? Q.resolve(el) : Q.reject("empty collection");
};

module.exports = localcollection;

/*
 * data/localcollection.js
 */

var Q = require('q'),
    storage = window.localStorage,

    _addToLocalIndex = function (name, indexKey) {
        var elts = JSON.parse(storage.getItem(indexKey));
        if(elts.indexOf(name) == -1) {
            elts.push(name);
            storage.setItem(indexKey, JSON.stringify(elts));
        }
    },
    _rmFromLocalIndex = function (name, indexKey) {
        var elts = JSON.parse(storage.getItem(indexKey)),
            filteredElts = elts.filter(function (el) { return el !== name; });
        storage.setItem(indexKey, JSON.stringify(filteredElts));
    };

module.exports = function (prefix, indexKey) {
    var collection = {
        set : function (name, item) {
            storage.setItem(prefix+name, item);
            _addToLocalIndex(name, indexKey);
            return Q.resolve(name);
        },
        del : function (name) {
            storage.removeItem(prefix+name);
            _rmFromLocalIndex(name, indexKey);
            return Q.resolve(name);
        },
        get : function (name) {
            return Q.resolve(storage.getItem(prefix+name));
        },
        list : function () {
            return Q.resolve(JSON.parse(storage.getItem(indexKey)));
        },
        first : function () {
            var el = JSON.parse(storage.getItem(indexKey))[0];
            return el ? Q.resolve(el) : Q.reject("empty collection");
        }
    };

    if (!storage.getItem(indexKey)) storage.setItem(indexKey, '[]');
    return collection;
};

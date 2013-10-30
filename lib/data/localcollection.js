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
        getObj : function (name) {
            return Q.resolve(JSON.parse(storage.getItem(prefix+name)));
        },
        rawlist : function (key) {
            var ids = JSON.parse(storage.getItem(indexKey)),
                data = [];
            ids.forEach(function (id) {
                data.push(JSON.parse(storage.getItem(prefix+id)));
            });
            return Q.resolve(data.filter(function (el) {
                return key ? el[key.name] === key.value : true;
            }));
        },
        list : function (key) {
            return collection.rawlist(key).then(function (l) {
                return l.map(function (d) { return d.name; });
            });
        },
        first : function (key) {
            if(key) {
                return collection.list(key).then(function (elts) {
                    return elts[0];
                });
            }
            var el = JSON.parse(storage.getItem(indexKey))[0];
            return el ? Q.resolve(el) : Q.reject("empty collection");
        },
        reset : function () {
            var items = JSON.parse(storage.getItem(indexKey)) || [];
            storage.removeItem(indexKey);
            items.forEach(function (item) { storage.removeItem(item); });
            return Q.resolve();
        }
    };

    if (!storage.getItem(indexKey)) storage.setItem(indexKey, '[]');
    return collection;
};

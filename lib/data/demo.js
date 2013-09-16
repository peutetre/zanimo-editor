/*
 * data/demo.js
 */

var Q = require('q'),
    demo = {},
    _storage = {},
    inc = 0;

demo.init = function () {
    demo.create("test 1", "function () { return 1; }");
    demo.create("test 2", "function () { return 2; }");
    demo.create("test 3", "function () { return 3; }");
    return Q.resolve(true);
};

demo.create = function (name, val) {
    _storage[name] = { id : inc++, val : val };
    return Q.resolve(name);
};

demo.save = function (name, val) {
    return Q.reject("Can't save demo...");
};

demo.del = function (name) {
    return Q.reject("Can't delete demo...");
};

demo.first = function () {
    for (var name in _storage) {
        if (_storage[name].id === 0) return Q.resolve(name);
    }
    return Q.reject("No script available...");
};

demo.list = function () {
    var l = [];
    for (var name in _storage) l.push(name);
    return Q.resolve(l);
};

demo.get = function (name) {
    return Q.resolve(_storage[name].val);
};

module.exports = demo;

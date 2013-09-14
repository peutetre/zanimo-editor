/*
 * data/demo.js
 */

var demo = {},
    _storage = {},
    inc = 0;

demo.init = function () {
    demo.create("test 1", "function () { return 1; }");
    demo.create("test 2", "function () { return 2; }");
    demo.create("test 3", "function () { return 3; }");
};

demo.create = function (name, val) {
    _storage[name] = { id : inc++, val : val };
};

demo.save = function (name, val) {
    throw new Error("Can't save demo...");
};

demo.del = function (name) {
    throw new Error("Can't delete demo...");
};

demo.first = function () {
    for (var name in _storage) {
        if (_storage[name].id === 0) return name;
    }
};

demo.list = function () {
    var l = [];
    for (var name in _storage)
        l.push(name);
    return l;
};

demo.get = function (name) {
    return _storage[name].val;
};

module.exports = demo;

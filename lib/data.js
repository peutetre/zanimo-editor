// data.js

"use strict";

var data = {},
    impl = {
        "demo" : require('./data/demo'),
        "local" : require('./data/local'),
        "gist" : require('./data/gist')
    },
    types = ["demo", "local", "gist"];

data.init = function () {
    types.forEach(function (type) {
        impl[type].init();
    });
};

data.types = types;

data.create = function (name, type, val) {
    return impl[type].create(name, val);
};

data.first = function (type) {
    return impl[type].first();
};

data.save = function (name, type, value) {
    return impl[type].save(name, value);
};

data.del = function (name, type) {
    return impl[type].del(name);
};

data.list = function (type) {
    return impl[type].list();
};

data.get = function (name, type) {
    return impl[type].get(name);
};

module.exports = data;

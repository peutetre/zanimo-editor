// data.js

"use strict";

var Q = require('q'),
    data = {},
    impl = {
        "demo" : require('./data/demo'),
        "local" : require('./data/local'),
        "gist" : require('./data/gist')
    },
    types = ["demo", "local", "gist"];

data.init = function () {
    return Q.all(types.map(function (type) {
        return impl[type].init();
    }));
};

data.sync = function (user) {
    if (user && user.newuser) impl['gist'].setLocalList([]);
    return impl['gist']
        .getRemoteList()
        .then(function (elts) {
            impl['gist'].setLocalList(elts);
            return user;
        });
};

data.deleteLocalGist = function () {
    return impl['gist'].reset();
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

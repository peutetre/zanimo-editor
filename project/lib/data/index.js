// index.js

"use strict";

var Q = require('q'),
    $ = require('../$'),
    notification = require('../notification'),
    data = {},
    impl = {
        "demo" : require('./demo'),
        "local" : require('./local'),
        "gist" : require('./gist'),
        "publicgist" : require('./publicgist'),
        "privategist" : require('./privategist')
    },
    types = ["demo", "local", "publicgist", "privategist"],
    typeLabels = {
        'demo' : 'demo',
        'local' : 'local',
        'publicgist' : 'public gist',
        'privategist' : 'private gist'
    };

data.init = function () {
    return Q.all([
            impl["demo"].init(),
            impl["local"].init(),
            impl["gist"].init()
        ]);
};

data.getInfo = function (name, type) {
    if (type === "publicgist" || type === "privategist") return impl['gist'].getId(name);
    else return Q.resolve(name);
};

data.sync = function (user) {
    return impl['gist'].sync(user);
};

data.syncƒ = function (user) {
    return data.sync(user).then(
        function () { return user; },
        function (err) {
            notification.fail($.formatError(err));
            return user;
        }
    );
};

data.types = types;
data.typeLabels = typeLabels;

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

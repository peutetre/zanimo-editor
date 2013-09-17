/*
 * data/gist.js
 */

var Q = require('q'),
    user = require('../user'),
    gist = {},
    storage = window.localStorage,
    indexKey = "zanimo-editor-gist-index";

function ids() {
    return JSON.parse(storage.getItem(indexKey));
}

function add(id) {
    var elts = ids();
    elts.push(id);
    storage.setItem(indexKey, JSON.stringify(elts));
}

function del(id) {
    return function () {
        storage.setItem(indexKey, JSON.stringify(ids().filter(function (el) {
            return el !== id;
        })));
        return Q.resolve(id);
    };
}

gist.init = function () {
    if (!storage.getItem(indexKey)) storage.setItem(indexKey, '[]');
    return Q.resolve(true);
};

gist.create = function (name, val) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.createGist(name, val).then(function (id) {
        if(ids().indexOf(id) === -1) add(id);
        return id;
    });
};

gist.save = function (id, val) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.updateGist(id, val);
};

gist.del = function (id) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.deleteGist(id).then(del(id), del(id));
};

gist.first = function () {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return Q.resolve(ids()[0]);
};

gist.list = function () {
    return Q.resolve(ids());
};

gist.setLocalList = function (arr) {
    storage.setItem(indexKey, JSON.stringify(arr));
};

gist.getRemoteList = function () {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.fetchGistsList();
};

gist.get = function (id) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.getGist(id).then(function (g) {
        return g.files['zanimo-animation.js']['content'];
    }, function (err) {
        if(err.error && err.request) del(id)();
        return Q.reject(err);
    });
};

module.exports = gist;

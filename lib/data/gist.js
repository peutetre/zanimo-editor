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

gist.del = function (name) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return Q.reject("✗ not implemented...");
};

gist.first = function () {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return Q.resolve(ids()[0]);
};

gist.list = function () {
    return Q.resolve(ids());
};

gist.get = function (id) {
    if(!user.islogged()) Q.reject("✗ Github auth needed!");
    return user.getGist(id).then(function (g) {
        return g.files['zanimo-animation.js']['content'];
    });
};

module.exports = gist;

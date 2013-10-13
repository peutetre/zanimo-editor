/*
 * data/gist.js
 */

"use strict";

var Q = require('q'),
    $ = require('../$'),
    user = require('../user'),
    notification = require('../notification'),
    collection = require('./localcollection'),
    _gistSet = null,
    states = ["local", "notsync", "sync"],
    gist = {};

function gistObj(id, name, val, state, t) {
    var t0 = t || (new Date()).toISOString();
    return JSON.stringify({
        data : val,
        id : id,
        name: name,
        state : state,
        time : t0
    });
}

function store(id, name, val, state, t) {
    return _gistSet.set(name, gistObj(id, name, val, state, t));
}

function storef(name, val, state) {
    return function (g) {
        return store(g.id, name, val, state, g.updated_at);
    };
}

function storeff(id, name, val, state, t) {
    return function () { return store(id, name, val, state, t); };
}

function toTS (dateStr) {
    return (new Date(dateStr)).getTime();
}

function _fetch(id) {
    return user.getGist(id).then(function (g) {
        var gc = g.files['zanimo-animation.js']['content'],
           desc = g.description,
           name = desc.length > 30 ? desc.substr(0,30)+'...' : desc;
        return _gistSet.set(name, gistObj(id, name, gc, "sync", g.updated_at));
    });
}

function _batchDownload(glist) {
    return glist.reduce(function (sofar, id) {
        return sofar.then(function () {
            return _fetch(id);
        });
    }, Q());
}

function _batchUpload(glist) {
    return glist.reduce(function (sofar, name) {
        return sofar.then(function () {
            return _gistSet.getObj(name)
                .then(function (g) {
                    if(g.state === "local") {
                        return user.createGist(name, g.data)
                            .then(storef(name, g.data, "sync"));
                    }
                    else {
                        return user.updateGist(g.id, g.data)
                            .then(storef(name, g.data, "sync"));
                    }
                });
        });
    }, Q());
}

function _getLocalList() {
    return _gistSet.list()
        .then(function (ids) {
            return Q.all(ids.map(function(name) {
                return _gistSet.getObj(name);
            }));
        });
}

function _compareWithLocal (remoteList) {
    var remoteToDownload = [],
        localToUpload = [],
        remoteTemp = {},
        localListIds = [],
        defer = Q.defer();

    try {
        _getLocalList().then(function (localList) {
            remoteList.forEach(function (rg) {
                remoteTemp[rg.id] = {
                    name : rg.name,
                    id : rg.id,
                    time : rg.time
                };
            });
            localList.forEach(function (lg) {
                if(!lg.id) { localToUpload.push(lg.name); }
                else {
                    if(toTS(lg.time) > toTS(remoteTemp[lg.id].time)){
                        localToUpload.push(lg.name);
                    }
                    if(toTS(lg.time) < toTS(remoteTemp[lg.id].time))
                        remoteToDownload.push(lg.id);
                    localListIds.push(lg.id);
                }
            });
            Object.keys(remoteTemp).forEach(function (ridx) {
                if(localListIds.indexOf(ridx) < 0) remoteToDownload.push(ridx);
            });
            defer.resolve([remoteToDownload, localToUpload]);
        });
    } catch(err) { defer.reject(err); }
    return defer.promise;
}

gist.init = function () {
    _gistSet = collection("zag-", "zanimo-editor-gist-index");
    return Q.resolve(_gistSet);
};

gist.create = function (name, val) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return user.createGist(name, val).then(storef(name, val, "sync"),
        function (err) {
            return notification.fail($.formatError(err))
                .then(storeff(null, name, val, "local"));
        });
};

gist.save = function (name, val) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.getObj(name).then(function (g) {
        if(g.state === "local") return gist.create(name, val);
        return user.updateGist(g.id, val)
            .then(storef(name, val, "sync"), function (err) {
                return notification.fail($.formatError(err))
                    .then(storeff(g.id, name, val, "notsync"));
            });
    });
};

gist.del = function (name) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.getObj(name)
        .then(function (gd) {
            if (gd.id) return user.deleteGist(gd.id);
        })
        .then(function () { return _gistSet.del(name); });
};

gist.first = function () {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.first().then(function (rst) {
        return rst;
    }, function(err) {
        return Q.reject("✗ No script available...");
    });
};

gist.list = function () {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.list();
};

gist.get = function (name) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.getObj(name).then(function (gd) { return gd.data; });
};

gist.getId = function (name) {
    return _gistSet.getObj(name).then(function (g) { return g.id; });
};

gist.sync = function (ghuser) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    if (ghuser && ghuser.newuser) {
        _gistSet.reset(); gist.init();
    }
    return user.fetchGistsList()
        .then(_compareWithLocal)
        .spread(function (gistsToDownload, gistsToUpload) {
            return Q.all([
                _batchDownload(gistsToDownload),
                _batchUpload(gistsToUpload)
            ]);
        }).then(function () { return ghuser; });
};

module.exports = gist;

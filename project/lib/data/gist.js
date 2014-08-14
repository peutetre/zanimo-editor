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

function gistObj(id, name, val, state, t, isPublic) {
    var t0 = t || (new Date()).toISOString();
    return {
        data : val,
        id : id,
        name: name,
        state : state,
        time : t0,
        'public' : isPublic
    };
}

function store(id, name, val, state, t, isPublic) {
    return _gistSet.setObj(name, gistObj(id, name, val, state, t, isPublic));
}

function storef(val, state) {
    return function (g) {
        return store(g.id, g.name, val, state, g.updated_at, g['public']);
    };
}

function storeff(id, name, val, state, t, isPublic) {
    return function () { return store(id, name, val, state, t, isPublic); };
}

function toTS (dateStr) {
    return (new Date(dateStr)).getTime();
}

function _fetch(id) {
    return user.getGist(id).then(function (g) {
        var gc = g.files['zanimo-animation.js']['content'],
           desc = g.description,
           name = desc.length > 30 ? desc.substr(0,30) + '...' : desc;

        return _gistSet.rawlist().then(function (list) {
            var l = list.filter(function (el) { return el.id === id; });
            if(l[0] && l[0].name !== name) _gistSet.del(l[0].name);
            return _gistSet.setObj(
                name,
                gistObj(id, name, gc, "sync", g.updated_at, g['public'])
            );
        });
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
                        return user.createGist(name, g.data, g['public'])
                            .then(storef(g.data, "sync"));
                    }
                    else {
                        return user.updateGist(g.id, g.data)
                            .then(storef(g.data, "sync"));
                    }
                });
        });
    }, Q());
}

function _batchDelete(glist) {
    return glist.reduce(function (sofar, name) {
        return sofar.then(function () {
            return _gistSet.del(name);
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
        localToDelete = [],
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
                else if (!remoteTemp[lg.id]) {
                    localToDelete.push(lg.name);
                }
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
            defer.resolve([remoteToDownload, localToUpload, localToDelete]);
        });
    } catch(err) { defer.reject(err); }
    return defer.promise;
}

gist.init = function () {
    _gistSet = collection("zag-", "zanimo-editor-gist-index");
    return Q.resolve(_gistSet);
};

gist.create = function (name, val, isPublic) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return user.createGist(name, val, isPublic).then(storef(val, "sync"),
        function (err) {
            return notification.fail($.formatError(err))
                .then(storeff(null, name, val, "local", null, isPublic));
        });
};

gist.save = function (name, val) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.getObj(name).then(function (g) {
        if(g.state === "local") return gist.create(name, val, g['public']);
        return user.updateGist(g.id, val)
            .then(storef(val, "sync"), function (err) {
                return notification.fail($.formatError(err))
                    .then(storeff(g.id, name, val, "notsync", null, g['public']));
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

gist.first = function (isPublic) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.first({ name: 'public', value: isPublic }).then(function (rst) {
        return rst;
    }, function(err) {
        return Q.reject("✗ No script available...");
    });
};

gist.list = function (isPublic) {
    if(!user.islogged()) return Q.reject("✗ Github auth needed!");
    return _gistSet.list({ name: 'public', value : isPublic });
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
        .spread(function (gistsToDownload, gistsToUpload, localsToDelete) {
            return Q.all([
                _batchDownload(gistsToDownload),
                _batchUpload(gistsToUpload),
                _batchDelete(localsToDelete)
            ]);
        }).then(function () { return ghuser; });
};

module.exports = gist;

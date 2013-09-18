/*
 * user.js
 */

"use strict";

function identity(el) { return function (err) { return el; }; }

var Q = require('q'),
    Qajax = require('qajax'),
    Github = require('github-api'),
    Cookie = require('cookie'),

    notification = require('./notification'),
    config = require('../oauth.json'),

    user = {},
    github = null,
    githubuser = null,
    username = null,
    logged = false;

user.init = function () {
    var token = user.getUserInfo().token;
    if (token) return user.login();
    else { return Q.reject('user not logged...'); }
};

user.islogged = function () {
    return logged;
};

user.setUserInfo = function (t, u) {
    if(t) window.document.cookie = Cookie.serialize('oauth-token', t);
    if(u) window.document.cookie = Cookie.serialize('username', u);
};

user.getUserInfo = function () {
    var cookie = Cookie.parse(window.document.cookie);
    return {
        token : cookie['oauth-token'],
        username : cookie['username']
    };
};

user.login = function () {
    var d = Q.defer();

    github = new Github({
      token: user.getUserInfo().token,
      auth: "oauth"
    });

    githubuser = github.getUser();
    githubuser.show(null, function(err, u) {
        if (err) {
            return notification.fail(err, 1000)
                .then(function () {
                    d.reject(err);
                });
        }
        notification.success('✓ github login', 1000)
            .done(function () {
                logged = true;
                username = u.login;
                if (user.getUserInfo().username !== username)
                   u.newuser = true;
                user.setUserInfo(null, username);
                d.resolve(u);
            });
    });
    return d.promise;
};

user.fetchGistsList = function () {
    var d = Q.defer(),
        zanimoGists = [];
    if(!githubuser) return Q.reject("✗ Github auth needed!");
    githubuser.userGists(username, function(err, gists) {
        zanimoGists = gists.filter(function (gist) {
            for(var file in gist.files) {
                if (file.match(/zanimo\-animation\.js/)) return true;
            }
        }).map(function (el) { return el.id; });
        d.resolve(zanimoGists);
    });
    return d.promise;
};

user.createGist = function (name, val) {
    val = val || '// empty script';
    if (!Github.Gist) return Q.reject("✗ Github auth needed!");
    try {
        var gist = new Github.Gist({id:null}),
            desc = "A Zanimo animation " + name,
            defer = Q.defer();

        gist.create({
            'description' : desc,
            'public' : true,
            'files' : {
                'zanimo-animation.js' : {
                    'content' : val
                }
            }
        }, function (err, gist) {
            if (err) throw new Error(err);
            notification.success("created gist " + gist.id);
            defer.resolve(gist.id);
        });
    } catch(err) {
        defer.reject(err);
    }
    return defer.promise;
};

user.updateGist = function (id, val) {
    if (!Github.Gist) return Q.reject("✗ Github auth needed!");
    var gist = new Github.Gist({id:id}),
        defer = Q.defer();
    gist.update({
        'files' : {
            'zanimo-animation.js' : {
                'content' : val
            }
        }
    }, function (err, res) {
        if (err) defer.reject(err);
        defer.resolve(res);
    });
    return defer.promise;
};

user.deleteGist = function (id) {
    if (!Github.Gist) return Q.reject("✗ Github auth needed!");
    var gist = new Github.Gist({id:id}),
        defer = Q.defer();
    gist.delete(function (err, res) {
        if (err) defer.reject(err);
        defer.resolve(res);
    });
    return defer.promise;
};

user.getGist = function (id) {
    if (!Github.Gist) return Q.reject("✗ Github auth needed!");
    var gist = new Github.Gist({id:id}),
        defer = Q.defer();
    gist.read(function (err, res) {
        if (err) defer.reject(err);
        defer.resolve(res);
    });
    return defer.promise;
};

user.logout = function () {
    window.document.cookie = Cookie.serialize('oauth-token', '');
    Github.Gist = null;
    github = null;
    githubuser = null;
    logged = false;
};

user.authenticate = function () {
    window.location = config.site + "/login/oauth/authorize?client_id=" + config.clientId + "&scope=gist";
};

user.gatekeeperUrl = config.gatekeeperUrl + '/authenticate/';

user.onOAuthRedirect = function (match) {
    var d = Q.defer();
    history.pushState("", document.title, window.location.pathname);
    Qajax.getJSON(user.gatekeeperUrl + match[1])
        .then(function (da) {
            user.setUserInfo(da.token, null);
            d.resolve(user.login());
        });
    return d.promise;
};

module.exports = user;

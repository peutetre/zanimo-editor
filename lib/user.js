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
    formatError = require('./$').formatError,
    env = require('../env'),

    user = {},
    github = null,
    githubuser = null,
    login = null,
    onOAuthRedirectSuccess = function () {},
    onOAuthRedirectError = function () {},
    logged = false;

user.init = function (oauthRedirectSuccess, oauthRedirectError) {
    return function () {
        onOAuthRedirectSuccess = oauthRedirectSuccess;
        onOAuthRedirectError = oauthRedirectError;
        var userInfo = user.getUserInfo();
        if (userInfo.token) {
            github = new Github({
                token: userInfo.token,
                auth: "oauth"
            });
            githubuser = github.getUser();
            login = userInfo.login;
            logged = true;
            return Q.resolve({
                newuser : false,
                login : userInfo.login,
                token : userInfo.token,
                avatar_url : userInfo.avatar_url
            });
        }
        else { return Q.reject('✗ user not logged...'); }
    }
};

user.islogged = function () { return logged; };

user.setUserInfo = function (t, u, avatar_url) {
    if(t) window.document.cookie = Cookie.serialize('oauth-token', t);
    if(u) window.document.cookie = Cookie.serialize('login', u);
    if(avatar_url)
        window.document.cookie = Cookie.serialize('avatar_url', avatar_url);
    if(window.cordova) {
        window.localStorage.setItem('cookie', window.document.cookie);
    }
};

user.getUserInfo = function () {
    var cookie = Cookie.parse(
        window.cordova ? window.localStorage.getItem('cookie') : window.document.cookie
    );
    return {
        token : cookie['oauth-token'],
        login : cookie['login'],
        avatar_url : cookie['avatar_url']
    };
};

user.login = function () {
    var d = Q.defer();

    if(!github && !githubuser) {
        github = new Github({
          token: user.getUserInfo().token,
          auth: "oauth"
        });
        githubuser = github.getUser();
    }

    githubuser.show(null, function(err, u) {
        if (err) {
            return notification
                .fail(formatError(err), 1000)
                .then(function () {
                    d.reject(err);
                });
        }
        notification.success('✓ github login', 1000)
            .done(function () {
                login = u.login;
                if (user.getUserInfo().login !== login) {
                   u.newuser = true;
                }
                user.setUserInfo(null, login, u.avatar_url);
                logged = true;
                d.resolve(u);
            });
    });
    return d.promise;
};

user.fetchGistsList = function () {
    var d = Q.defer(),
        zanimoGists = [];
    if(!githubuser) return Q.reject("✗ Github auth needed!");
    githubuser.userGists(login, function(err, gists) {
        if (err) return d.reject(err);
        zanimoGists = gists.filter(function (gist) {
            for(var file in gist.files) {
                if (file.match(/zanimo\-animation\.js/)) return true;
            }
        }).map(function (el) {
            var desc = el.description;
            return {
                id : el.id,
                'public' : el['public'],
                time : el.updated_at,
                name : desc.length > 30 ? desc.substr(0,30)+'...' : desc
        }});
        d.resolve(zanimoGists);
    });
    return d.promise;
};

user.createGist = function (name, val, isPublic) {
    val = val || '// empty script';
    if (!Github.Gist) return Q.reject("✗ Github auth needed!");
    var gist = new Github.Gist({id:null}),
        defer = Q.defer();

    gist.create({
        'description' : name,
        'public' : isPublic,
        'files' : {
            'zanimo-animation.js' : {
                'content' : val
            }
        }
    }, function (err, gist) {
        if (err) return defer.reject(err);
        notification.success("created gist " + gist.id);
        return defer.resolve({
            id: gist.id,
            updated_at : gist.updated_at,
            'public' : isPublic,
            value : val,
            name : name
        });
    });
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
    }, function (err, g) {
        if (err) return defer.reject(err);
        var desc = g.description;
        return defer.resolve({
            id: g.id,
            updated_at : g.updated_at,
            'public' : g['public'],
            value : val,
            name : desc.length > 30 ? desc.substr(0,30)+'...' : desc
        });
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
        if (err) { defer.reject(err); }
        else { defer.resolve(res); }
    });
    return defer.promise;
};

user.logout = function () {
    window.document.cookie = Cookie.serialize('oauth-token', '');
    if(window.cordova) window.localStorage.setItem('cookie', '');
    Github.Gist = null;
    github = null;
    githubuser = null;
    logged = false;
    return Q.resolve(true);
};

user.authenticate = function () {
    var ghoauth = env.site + "/login/oauth/authorize?client_id=" + env.clientId + "&scope=gist";
    if(window.cordova) {
        var childbrowser = window.open(ghoauth, '_blank', 'location=no');
        childbrowser.clear();
        childbrowser.addEventListener('loadstop', function (evt) {
            setTimeout(function () {
                if(evt.url.match(/zanimo/)) {
                    childbrowser.close();
                    user.onOAuthRedirect(evt.url.replace(/http:\/\/zanimo.us\/cb\/\?code=/, ''))
                        .then(onOAuthRedirectSuccess, onOAuthRedirectError);
                }
            }, 2000);
        });
    } else {
        window.location = ghoauth;
    }
};

user.gatekeeperUrl = env.gatekeeperUrl + '/authenticate/';

user.onOAuthRedirect = function (match) {
    history.pushState("", document.title, window.location.pathname);
    return Qajax(user.gatekeeperUrl + match)
        .then(Qajax.filterStatus(function (code) {
            return code == 200;
        }))
        .then(Qajax.toJSON)
        .then(function (da) {
            user.setUserInfo(da.token, null);
            return user.login();
        });
};

module.exports = user;

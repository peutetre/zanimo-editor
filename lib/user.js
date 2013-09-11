/*
 * user.js
 */

"use strict";

function identity(el) { return function (err) { return el; }; }

var user = {},
    Q = require('q'),
    Qajax = require('qajax'),
    Github = require('github-api'),
    Cookie = require('cookie'),
    github = null,
    githubuser = null,
    notification = require('./notification'),
    config = require('../oauth.json');

user.init = function () {
    var token = Cookie.parse(window.document.cookie)['oauth-token'];
    if (token) return user.login();
    else { return Q.reject('user is not logged !'); }
};

user.setToken = function (t) {
    window.document.cookie = Cookie.serialize('oauth-token', t);
};

user.getToken = function () {
    return Cookie.parse(window.document.cookie)['oauth-token'];
};

user.login = function () {
    var d = Q.defer();

    github = new Github({
      token: user.getToken(),
      auth: "oauth"
    });

    githubuser = github.getUser();
    githubuser.show(null, function(err, u) {
        notification.success('✓ github login', 1000)
            .then(function () { d.resolve(u); }, function () { d.resolve(u); });
    });
    return d.promise;
};

user.logout = function () {
    window.document.cookie = Cookie.serialize('oauth-token', '');
};

user.authenticate = function () {
    window.location = config.site + "/login/oauth/authorize?client_id=" + config.clientId + "&scope=gist";
};

user.gatekeeperUrl = config.gatekeeperUrl + '/authenticate/';

user.onOAuthRedirect = function (match) {
    var d = Q.defer();
    history.pushState("", document.title, window.location.pathname);
    Qajax.getJSON(user.gatekeeperUrl + match[1])
        .then(function (data) {
            user.setToken(data.token);
            d.resolve(user.login());
        });
    return d.promise;
};

module.exports = user;

/*
 * user.js
 */

"use strict";

var user = {},
    token = null,
    JQuery = require('jquery-browserify'),
    Github = require('github-api'),
    Cookie = require('cookie'),
    github = null,
    config = require('../oauth.json');

user.init = function () {
    // check if we have something like a username and an oauth token
    console.log('user init');

    var match = window.location.href.match(/\?code=([a-z0-9]*)/);
        // in auth process
    if (match) {
        JQuery.ajax(user.gatekeeperUrl + match[1], {
            success : function (data) {
                user.set(data.token);
                user.login();
            },
            error : function () {
                // TODO
            }
        });
    }
    else {
        // token ?
        var t = Cookie.parse(window.document.cookie)['oauth-token'];
        if (t) {
            user.login();
        }
        else {
            console.log('user is not logged !');
        }
    }
};


user.set = function (t) {
    token = t;
    console.log(Cookie.serialize('oauth-token', t));
    window.document.cookie = Cookie.serialize('oauth-token', t);
};

user.getToken = function () {
    return Cookie.parse(window.document.cookie)['oauth-token'];
}

user.login = function () {
    window.github = github = new Github({
      token: user.getToken(),
      auth: "oauth"
    });
    user = github.getUser();
    window.user = user;
    user.show(null, function(err, user) {
        console.log(user);
    });
};

user.authenticate = function () {
    window.location = config.site + "/login/oauth/authorize?client_id=" + config.clientId + "&scope=gist";
};

user.gatekeeperUrl = config.gatekeeperUrl + '/authenticate/';

module.exports = user;

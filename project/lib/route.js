/*
 * route.js - simple router
 */

"use strict";

var Q = require('q'),
    $ = require('./$');

function getUri() {
    var defer = Q.defer();
    if(window.cordova && $.detect.android) {
        cordova.exec(function(uri) {
            if(!uri) defer.resolve(window.location.href);
            else defer.resolve(uri);
        }, function(err) {
            defer.reject(err);
        }, 'WebIntent', 'getUri', []);
    }
    else {
        defer.resolve(window.location.href);
    }
    return defer.promise;
};

function route(routes) {

    return function () {
        return getUri().then(function (uri) {
            var r = null,
                match = null;

            for(r in routes) {
                match = uri.match(window.RegExp(r));
                if(match) return routes[r](match);
            }
            if(routes[""]) return routes[""]();
        }, function (err) {
            console.log(err);
            if(routes[""]) return routes[""]();
        });
    };
}

module.exports = route;

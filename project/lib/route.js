/*
 * route.js - simple router
 */

"use strict";

var Q = require('q'),
    $ = require('./$');

function getUri() {
    return Q(window.location.href);
};

function route(routes) {

    return function () {
        return getUri().then(function (uri) {
            var r = null,
                match = null;

            for(r in routes) {
                match = uri.match(window.RegExp(r));
                console.log(match, r);
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

/*
 * route.js - simple router
 */

"use strict";

function route(routes) {
    return function () {
        var url = window.location.href,
            r = null,
            match = null;

        for(r in routes) {
            match = url.match(window.RegExp(r));
            if(match) return routes[r](match);
        }
        if(routes[""]) return routes[""]();
    };
}

module.exports = route;

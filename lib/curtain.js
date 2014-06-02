/*
 * curtain.js - the curtain containing the documentation
 */

"use strict";

var curtain = {},
    Zanimo = require('zanimo'),
    Q = require('q'),
    _$ = require('./$'),
    notification = require('./notification');

var state = true,
    $documentation,
    $activeArea,
    close = function (elt) {
        return _$.getViewportHeight().then(function (h) {
            return Zanimo(elt,
                "transform",
                "translate3d(0, " + (h - 30) + "px,0)",
                400,
                "ease-in-out"
            );
        });
    },
    open = Zanimo.f("transform", "translate3d(0,0,0)", 400, "ease-in-out"),
    errorLog = function (err) { new window.Error(err.message); },
    resize = function () {
        if(state) Zanimo($documentation).then(open).done(_$.empty, _$.empty);
    },
    animate = function () {
        if(state) {
            state = false;
            return Zanimo($documentation)
                        .then(close)
                        .then(notification.disable);
        }

        state = true;
        return Zanimo($documentation)
                    .then(open)
                    .then(notification.activate);
    },
    activeAreaAction = function (evt) {
        evt.preventDefault();
        window.setTimeout(animate, 500);
    };

curtain.init = function () {
    $documentation = _$.$("article.documentation");
    $activeArea = _$.$("div.active-area");

    window.addEventListener("resize", resize);
    $activeArea.addEventListener(_$.isTouchable ? "touchstart" : "click", activeAreaAction);
    
    return Q(true);
};

curtain.isOpen = function () {
    return state;
};

curtain.animate = animate;

module.exports = curtain;

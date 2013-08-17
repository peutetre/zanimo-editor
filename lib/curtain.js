/*
 * curtain.js - the curtain containing the documentation
 */

"use strict";

var curtain = {},
    Zanimo = require('zanimo'),
    _$ = require('./$');

var state = false,
    $documentation,
    $activeArea,
    $star,
    $hiddenA,
    openedLenght = function () {
        return "translate3d(0, -" + (window.outerHeight - 80) + "px,0)";
    },
    hiddenLenght = function () {
        return "translate3d(0, -" + (window.outerHeight - 30) + "px,0)";
    },
    open = function (elt) {
        return Zanimo.transition(elt, "transform", openedLenght(), 400, "ease-in-out");
    },
    hide = function (elt) {
        return Zanimo.transition(elt, "transform", hiddenLenght(), 400, "ease-in-out");
    },
    close = Zanimo.transitionf("transform", "translate3d(0,0,0)", 400, "ease-in-out"),
    downStar = Zanimo.transitionf("transform", "translate3d(0,18px,0) rotate(150deg)", 200, "ease-in-out"),
    upStar = Zanimo.transitionf("transform", "translate3d(0,0,0)", 200, "ease-in-out"),
    errorLog = function (err) { new window.Error(err.message); },
    resize = function () {
        if(state) Zanimo($documentation).then(hide).done(_$.empty, _$.empty);
    },
    animate = function () {
        if(state) {
            state = false;
            return Zanimo($documentation)
                        .then(close)
                        .then(Zanimo.f($star))
                        .then(upStar, errorLog);
        }
        else {
            state = true;
            return Zanimo($documentation)
                        .then(open)
                        .then(hide)
                        .then(Zanimo.f($star))
                        .then(downStar, errorLog);
        }
    },
    activeAreaAction = function (evt) {
        evt.preventDefault();
        $hiddenA.focus();
        window.setTimeout(animate, 500);
    };

curtain.init = function () {
    $documentation = _$.$("article.documentation");
    $activeArea = _$.$("div.active-area");
    $star = _$.$(".chip span");
    $hiddenA = _$.$("#hidden-a");
};

curtain.bind = function () {
     if(!_$.isTouchable) window.addEventListener("resize", resize);
     window.addEventListener("orientationchange", resize);
     $activeArea.addEventListener(_$.isTouchable ? "touchstart" : "click", activeAreaAction);
};

curtain.animate = animate;
module.exports = curtain;

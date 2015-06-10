/*
 * notification.js
 */

"use strict";

var notification = {},
    Q = require('q'),
    Zanimo = require('zanimo'),
    _$ = require('./$'),
    toWhite = Zanimo.f("color", "#F0F1F3", 150),
    toGreen = Zanimo.f("color", "rgb(70, 170, 70)", 150),
    toRed = Zanimo.f("color", "rgb(255, 111, 111)", 150),
    toLeft = Zanimo.f("transform", "translate3d(-170px,0px,0)", 150),
    toRight = Zanimo.f("transform", "translate3d(170px,0px,0)", 150),
    toOrigin = Zanimo.f("transform", "translate3d(0,0px,0)", 150),
    toOpacity1 = Zanimo.f("opacity", 1, 150),
    toOpacity0 = Zanimo.f("opacity", 0, 150),
    downStar = Zanimo.f("transform", "translate3d(0,0px,0)", 200, "ease-in-out"),
    upStar = Zanimo.f("transform", "translate3d(0,-18px,0)", 200, "ease-in-out"),
    initialized = false,
    inuse = false,
    active = false,
    $star = null,
    $star2 = null,
    $txt = null,
    options = {
        infoDuration : 1000,
        failDuration : 1000,
        successDuration : 1000
    };

notification.init = function (config) {
    if (config)
        for (var op in options)
            if (config[op])
                options[op] = config[op];
    $star = _$.$(".chip");
    $star2 = _$.$(".chip2");
    $txt = _$.$(".chip-container div.msg strong");
    initialized = true;

    notification.activate();
};

function blinkStar () {
    return Zanimo($star)
            .then(toGreen)
            .then(toWhite)
            .then(toGreen)
            .then(toWhite)
            .then(toGreen)
            .then(toWhite);
};

function show() {
    return Q.all([
        Zanimo($star).then(function (el) { return Q.all([toLeft(el), toOpacity0(el)]); }),
        Zanimo($star2).then(function (el) { return Q.all([toRight(el), toOpacity0(el)]); }),
        Q.delay($txt, 50).then(toOpacity1)
    ]);
};

function hide() {
    return Q.all([
        Zanimo($star).then(function (el) { return Q.all([toOrigin(el), toOpacity1(el)]); }),
        Zanimo($star2).then(function (el) { return Q.all([toOrigin(el), toOpacity1(el)]); }),
        Zanimo($txt).then(toOpacity0)
    ]);
};

function clean () {
    $txt.innerHTML = "";
    inuse = false;
};

function setColor (e1,e2,e3, c) {
    return Q.all([
                Zanimo(e1).then(c),
                Zanimo(e2).then(c),
                Zanimo(e3).then(c)
            ]);
};

notification.activate = function () {
    return Q.all([
        Zanimo($star).then(downStar),
        Zanimo($star2).then(downStar)
    ]).then(function () {
        active = true;
    });
};

notification.disable = function () {
    return Q.all([
        Zanimo($star).then(upStar),
        Zanimo($star2).then(upStar)
    ]).then(function () {
        active = false;
    });
};

notification.fail = function (msg, dur) {
    if (!initialized) return Q.reject("Notification not initialized, can't display: " + msg);
    if (inuse) return Q.reject("Notification currently active, can't display: " + msg);
    if(!active) return Q.reject("Notification is not active, cant'display: " + msg);

    inuse = true;
    $txt.innerHTML = msg;
    return  Q.all([ show(), setColor($star, $star2, $txt, toRed) ])
        .then(function () { return Q.delay(dur || options.failDuration); })
        .then(hide)
        .then(function () { return setColor($star, $star2, $txt, toWhite); })
        .then(clean, clean);
};

notification.failƒ = function (msg, dur) {
    return function () { return notification.fail(msg, dur); };
};

notification.info = function (msg, dur) {
    if (!initialized) return Q.reject("Notification not initialized, can't display: " + msg);
    if (inuse) return Q.reject("Notification currently active, can't display: " + msg);
    if(!active) return Q.reject("Notification is not active, cant'display: " + msg);

    inuse = true;
    $txt.innerHTML = msg;
    return show()
        .then(function () { return Q.delay(dur || options.infoDuration); })
        .then(hide)
        .then(clean, clean);
};

notification.infoƒ = function (msg, dur) {
    return function () { return notification.info(msg, dur); };
};

notification.success = function (msg, dur) {
    if (!initialized) return Q.reject("Notification not initialized, can't display: " + msg);
    if (inuse) return Q.reject("Notification currently active, can't display: " + msg);
    if(!active) return Q.reject("Notification is not active, cant'display: " + msg);

    inuse = true;
    if (!msg) return blinkStar().then(clean, clean);
    $txt.innerHTML = msg;
    return  Q.all([ show(), setColor($star, $star2, $txt, toGreen) ])
        .then(function () { return Q.delay(dur || options.successDuration); })
        .then(hide)
        .then(function () { return setColor($star, $star2, $txt, toWhite); })
        .then(clean, clean);
};

notification.successƒ = function (msg, dur) {
    return function () { return notification.success(msg, dur); };
};

module.exports = notification;

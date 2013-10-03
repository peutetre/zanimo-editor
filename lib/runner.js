/*
 * runner.js - the script runner
 */

"use strict";

var Q = require('q'),
    Zanimo = require('zanimo'),
    $ = require('./$'),

    notification = require('./notification'),
    alert = require('./overlays/alert'),
    Curtain = require('./curtain'),

    runner = {},

    prog,
    progPromise,
    $animScreen,
    elements,
    running = false;

runner.init = function () {
    $animScreen = $.$("article.anim-screen");

    $animScreen.addEventListener($.isMobile ? 'touchstart': 'click',
        function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            runner.done();
            return false;
    });

    window.addEventListener('keyup', function (evt) {
        if(evt.keyCode === 27 && running) runner.done();
    });

};

runner.hideScreen = function () {
    $animScreen.style.display = "none";
};

runner.showScreen = function () {
    $animScreen.style.display = "block";
};

runner.run = function (code) {
    if (!running) {
        try {
            running = true;
            elements = [];
            prog = new Function (
                "Q",
                "Zanimo",
                "create",
                "start",
                "window",
                "document",
                code
            );
            progPromise = prog.call(
                {},
                Q,
                Zanimo,
                runner.create,
                runner.start,
                {},{}
            );
            if(Q.isPromise(progPromise))
                return progPromise.then(runner.done, runner.fail);
            throw new Error("Runner exception, you need to return a promise!");
        } catch(err) {
            runner.done().then(function () {
                alert.show('Runner Error', err.stack.replace(/\n/g, '<br>'));
            });
        }
    }
};

runner.create = function (definitions) {
    var el, attr, items = [];
    definitions.forEach(function (def) {
        el = $.DOM("div");
        el.style.width = "100px";
        el.style.height = "100px";
        el.style.position = "absolute";
        el.style.backgroundColor = "rgb(118, 189, 255)";
        el.style.zIndex = 10000;
        for(attr in def) {
            el.style[attr] = def[attr];
        }
        elements.push(el);
        items.push(el);
        document.body.appendChild(el);
    });
    return items;
};

runner.start = function (el) {
    $animScreen.style.display = "block";
    return Q.delay(200)
            .then(Zanimo.f($animScreen))
            .then(Zanimo.transitionf("opacity", 1, 200))
            .then(function () { return el; });
};

runner.clean = function () {
    elements.forEach(function (el) {
        try {
            window.document.body.removeChild(el);
        } catch(err) {
            notification.fail("✗ fail cleaning the runner");
        }
    });
};

runner.done = function () {
    runner.clean();
    return Zanimo.transition($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .then(function () { return Q.delay(200).then(function () {
                    running = false;
                    if (!Curtain.isOpen()) Curtain.open();
                 })});
};

runner.fail = function (err) {
    runner.clean();
    return Zanimo.transition($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .then(function () { return Q.delay(200).then(function () {
                    running = false;
                    if (!Curtain.isOpen()) Curtain.open();
                 })});
};

module.exports = runner;

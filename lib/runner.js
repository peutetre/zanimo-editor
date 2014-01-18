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
                "width",
                "height",
                code
            );
            progPromise = prog.call(
                {},
                Q,
                Zanimo,
                runner.create,
                runner.start,
                window.innerWidth + 'px',
                (window.innerHeight + 10) + 'px'
            );
            if(Q.isPromise(progPromise))
                return progPromise.then(runner.done, runner.fail);
            throw new Error("Runner exception, you need to return a promise!");
        } catch(err) {
            runner.done().then(function () {
                alert.show('Runner Error', err.message);
            });
        }
    }
};

runner.create = function (definitions, tag) {
    var el, attr, items = [];
    if (definitions instanceof Array) {
        definitions.forEach(function (def) {
            el = $.DOM(tag || 'div');
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
    }
    else if(definitions instanceof Object) {
        el = $.DOM(tag || 'div');
        el.style.width = "100px";
        el.style.height = "100px";
        el.style.position = "absolute";
        el.style.backgroundColor = "rgb(118, 189, 255)";
        el.style.zIndex = 10000;
        for(attr in definitions) {
            el.style[attr] = definitions[attr];
        }
        elements.push(el);
        document.body.appendChild(el);
        return el;
    }
    else {
        throw new Error('<i>create</i> argument is either an array or an object!');
    }
};

runner.start = function (el) {
    return Zanimo($animScreen, 'display', 'block')
            .delay(200)
            .then(Zanimo.f("opacity", 1, 200))
            .then(function () { return el; });
};

runner.clean = function () {
    elements.reverse().forEach(function (el) {
        try {
            window.document.body.removeChild(el);
        } catch(err) { }
    });
};

runner.done = function () {
    runner.clean();
    return Zanimo($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .delay(200).then(function () {
                     running = false;
                     if (!Curtain.isOpen()) Curtain.animate();
                 });
};

runner.fail = function (err) {
    runner.clean();
    return Zanimo($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .delay(200).then(function () {
                     running = false;
                     if (!Curtain.isOpen()) Curtain.animate();
                 });
};

module.exports = runner;

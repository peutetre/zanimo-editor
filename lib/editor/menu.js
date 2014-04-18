/*
 * menu.js
 */

"use strict";

var Q = require('q'),
    IScroll = require('iscroll'),
    Zanimo = require('zanimo'),
    MobileButton = require('mobile-button'),
    data = require('../data'),
    $ = require('../$'),
    softkeyboard = require('../softkeyboard'),

    menu = {},

    options = null,
    cb = null,
    open = false,
    $btn = null,
    $menu = null,
    $menuTmpl = "",
    btn = null,
    btns = [],
    scroll = null,
    $scroller = null;

menu.init = function (f, opts) {
    options = opts;
    cb = f;
    $btn = $.$("article.editor div.menu");
    $menu = $.$("article.editor div.menu-list");
    $scroller = $.$("ul", $menu);
    $menuTmpl = $.$("#menu-content").innerHTML;

    scroll = new IScroll($.$("div.wrapper", $menu), {
        mouseWheel: true
    });

    btn = new MobileButton.Touchend({
        el: $btn,
        f : menu.trigger
    });

    btn.bind();
};

menu._hide = function () {
    return Q.all([
        Zanimo($menu, 'height', '50px', 300),
        Zanimo($menu, 'transform', 'translate3d(0,0,0)', 300)
     ]).then(function () { open = false; scroll.refresh(); });
};

menu.trigger = function () {
    softkeyboard.hide();
    return Q.all([
            Zanimo($menu, 'height', open ? '50px' : '250px', 300),
            Zanimo($menu, 'transform', open ? 'translate3d(0,0,0)' : 'translate3d(0,50px,0)', 300)
         ])
        .then(function () { open = !open; scroll.refresh(); });
};

menu.render = function (name) {
    var toLiƒ = function (idx) {
            return function (v) {
                return "<li data-type=\"" + options.sections[idx] + "\">" + v + "</li>";
            };
        },
        idƒ = function (l) { return  l; },
        emptyArrayƒ = function (err) { return []; },

        demoItems = data.list(data.types[0]),
        localItems = data.list(data.types[1]),
        publicGistItems = data.list(data.types[2]).then(idƒ, emptyArrayƒ),
        privateGistItems = data.list(data.types[3]).then(idƒ, emptyArrayƒ);

    btns.forEach(function (b) { b.unbind(); });
    btns = [];

    return Q.all([demoItems, localItems, publicGistItems, privateGistItems])
        .then(function (vals) {
            var res = vals.map(function (v, idx) {
                return v.map(toLiƒ(idx));
            });
            $scroller.innerHTML = $menuTmpl.replace(/\{\{0\}\}/, res[0].join(''))
                .replace(/\{\{1\}\}/, res[1].join(''))
                .replace(/\{\{2\}\}/, res[2].join(''))
                .replace(/\{\{3\}\}/, res[3].join(''));
        })
        .then(function () {
            Array.prototype.forEach.call($.$$('li:not(.section)', $scroller), function (el) {
                btns.push((new MobileButton.ScrollableY.Touchend({
                    el: el,
                    f: function (evt) {
                        menu.hide();
                        cb(evt.target.innerHTML.trim(), evt.target.getAttribute('data-type'));
                    }
                })).bind());
            });
            $btn.innerHTML = name;
            scroll.refresh();
        });
};

menu.set = function (val) { $btn.innerHTML = val; };

menu.hide = function () {
    if(open) return menu._hide();
    else return Q();
};

module.exports = menu;

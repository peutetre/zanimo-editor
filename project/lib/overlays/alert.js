/*
 * alert.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    MobileButton = require('mobile-button'),
    $ = require('../$'),
    alert = {},
    el = null,
    $title = null,
    $msg = null,
    $closeBtn = null,
    closeBtn = null,
    displayed = false;

function onAction(evt) {
    evt.stopPropagation();
    return alert.hide();
}

alert.init = function () {
    el = $.DOM('div');
    el.className = 'alert';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    el.style.left = '-webkit-calc(50% - 160px)';
    el.style.left = '-moz-calc(50% - 160px)';
    el.style.left = '-ms-calc(50% - 160px)';
    el.style.left = 'calc(50% - 160px)';
    el.style.width = '320px';
    el.style.height = '300px';
    el.style.opacity = 1;
    el.style.zIndex = 11;
    $title = $.DOM('h2');
    $msg = $.DOM('div');
    $closeBtn = $.DOM('span');
    $closeBtn.innerHTML = 'CLOSE';
    el.appendChild($title);
    el.appendChild($msg);
    el.appendChild($closeBtn);
    window.document.body.appendChild(el);

    closeBtn = new MobileButton.Touchend({
        el: $closeBtn,
        f: onAction,
        autobind: false
    });

    window.addEventListener('keyup', function (evt) {
        if(evt.keyCode === 27 && displayed) alert.hide();
    });

    return Q.resolve(el);
};

alert.show = function (title, msg, opts) {
    Mask.onTouch(onAction);
    $title.innerHTML = title;
    $msg.innerHTML = msg;
    return Q.all([Zanimo(el)
        .then(Zanimo.f(
            'transform',
            'translate3d(0,1030px,0)',
            400,
            'ease-in'
        )), Mask.show()]).then(function () {
            displayed = true;
            closeBtn.bind();
        });
};

alert.hide = function () {
    return Q.all([Zanimo(el)
        .then(Zanimo.f(
            'transform',
            'translate3d(0,0,0)',
            400,
            'ease-in'
        )), Mask.hide()]).then(function () {
            displayed = false;
            Mask.onTouch(function () { });
            closeBtn.unbind();
        });
};

module.exports = alert;

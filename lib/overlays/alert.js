/*
 * alert.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    $ = require('../$'),
    alert = {},
    el = null,
    $title = null,
    $msg = null,
    $closeBtn = null,
    displayed = false;

function onAction(evt) {
    evt.stopPropagation();
    alert.hide();
}

alert.init = function () {
    el = $.DOM('div');
    el.className = 'alert';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    el.style.left = window.innerWidth <= 480 ?  '0' : '25%';
    el.style.width = window.innerWidth <= 480 ? '100%' : '50%';
    el.style.height = window.innerWidth <= 480 ? '280px' : '250px';
    el.style.opacity = 1;
    el.style.zIndex = 11;
    $title = $.DOM('h2');
    $msg = $.DOM('p');
    $closeBtn = $.DOM('span');
    $closeBtn.innerHTML = 'CLOSE';
    el.appendChild($title);
    el.appendChild($msg);
    el.appendChild($closeBtn);
    window.document.body.appendChild(el);

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
        .then(Zanimo.transitionf(
            'transform',
            'translate3d(0,' + (1000+10) + 'px,0)',
            400,
            'ease-in'
        )), Mask.show()]).then(function () {
            displayed = true;
            $closeBtn.addEventListener(
                $.isTouchable ? "touchstart" : "click",
                onAction
            );
        });
};

alert.hide = function () {
    return Q.all([Zanimo(el)
        .then(Zanimo.transitionf(
            'transform',
            'translate3d(0,0,0)',
            400,
            'ease-in'
        )), Mask.hide()]).then(function () {
            displayed = false;
            Mask.onTouch(function () { });
            $closeBtn.removeEventListener(
                $.isTouchable ? "touchstart" : "click",
                onAction
            );
        });
};

module.exports = alert;

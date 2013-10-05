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

function height() { return ($.getViewportHeight()/2); }

alert.init = function () {
    var h = height();

    el = $.DOM('div');
    el.className = 'alert';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    el.style.left = '25%';
    el.style.width = '50%';
    el.style.height = h + 'px';
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
    Mask.onTouch(alert.hide);
    $title.innerHTML = title;
    $msg.innerHTML = msg;
    return Q.all([Zanimo(el)
        .then(Zanimo.transitionf(
            'transform',
            'translate3d(0,' + (1000+height()/2) + 'px,0)',
            400,
            'ease-in'
        )), Mask.show()]).then(function () {
            displayed = true;
            $closeBtn.addEventListener(
                $.isTouchable ? "touchstart" : "click",
                alert.hide
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
            $closeBtn.removeEventListener(
                $.isTouchable ? "touchstart" : "click",
                alert.hide
            );
        });
};

module.exports = alert;

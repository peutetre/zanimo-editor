/*
 * confirm.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    $ = require('../$'),
    softkeyboard = require('../softkeyboard'),
    confirm = {},
    el = null,
    $title = null,
    $msg = null,
    $okBtn = null,
    $closeBtn = null,
    defer = null,
    displayed = false;

function height() { return ($.getViewportHeight()/2); }

confirm.init = function () {
    var h = height();

    el = $.DOM('div');
    el.className = 'prompt';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    el.style.left = window.innerWidth <= 480 ?  '0' : '25%';
    el.style.width = window.innerWidth <= 480 ? '100%' : '50%';
    el.style.height = '129px';
    el.style.opacity = 1;
    el.style.zIndex = 11;
    $title = $.DOM('h2');
    $msg = $.DOM('p');
    $closeBtn = $.DOM('span');
    $closeBtn.innerHTML = 'NO';
    $okBtn = $.DOM('span');
    $okBtn.className = 'ok';
    $okBtn.innerHTML = 'YES';
    el.appendChild($title);
    el.appendChild($msg);
    el.appendChild($closeBtn);
    el.appendChild($okBtn);
    window.document.body.appendChild(el);

    window.addEventListener('keyup', function (evt) {
        if(evt.keyCode === 27 && displayed) onCloseBtn();
        if(evt.keyCode === 13 && displayed) onOkBtn();
    });

    return Q.resolve(el);
};

function _hide() {
    softkeyboard.hide();
    return Q.all([
        Zanimo.transition(
            el, 'transform',
            'translate3d(0,0,0)',
            400,
            'ease-in'
        ),
        Mask.hide()
   ]).then(function () {
       displayed = false;
        $closeBtn.removeEventListener(
            $.isTouchable ? "touchstart" : "click",
            onCloseBtn
        );
        $okBtn.addEventListener(
            $.isTouchable ? "touchstart" : "click",
            onOkBtn
        );
    });
}

function onOkBtn() {
    _hide().then(function () { defer.resolve(true); });
}

function onCloseBtn() {
    _hide().then(function () { defer.resolve(false); });
}

confirm.confirm = function (title, msg) {
    defer = Q.defer();
    $title.innerHTML = title;
    $msg.innerHTML = msg;
    Q.all([
        Zanimo.transition(
            el, 'transform',
            'translate3d(0,' + (1000+height()/2) + 'px,0)',
            400, 'ease-in'
        ),
        Mask.show()
    ]).then(function () {
        displayed = true;
        $closeBtn.addEventListener(
            $.isTouchable ? "touchstart" : "click",
            onCloseBtn
        );
        $okBtn.addEventListener(
            $.isTouchable ? "touchstart" : "click",
            onOkBtn
        );
    });
    return defer.promise;
}

module.exports = confirm;

/*
 * prompt.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    $ = require('../$'),
    prompt = {},
    el = null,
    $title = null,
    $input = null,
    $okBtn = null,
    $closeBtn = null,
    defer = null;

function height() { return ($.getViewportHeight()/2); }

prompt.init = function () {
    var h = height();

    el = $.DOM('div');
    el.className = 'prompt';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    el.style.left = '25%';
    el.style.width = '50%';
    el.style.height = '129px';
    el.style.opacity = 1;
    el.style.zIndex = 11;
    $title = $.DOM('h2');
    $input = $.DOM('input');
    $closeBtn = $.DOM('span');
    $closeBtn.innerHTML = 'CLOSE';
    $okBtn = $.DOM('span');
    $okBtn.className = 'ok';
    $okBtn.innerHTML = 'OK';
    el.appendChild($title);
    el.appendChild($input);
    el.appendChild($closeBtn);
    el.appendChild($okBtn);
    window.document.body.appendChild(el);

    return Q.resolve(el);
};

function _hide() {
    return Q.all([
        Zanimo.transition(
            el, 'transform',
            'translate3d(0,0,0)',
            400,
            'ease-in'
        ),
        Mask.hide()
   ]).then(function () {
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
    _hide().then(function () {
        var val = $input.value ? $input.value.trim() : "";
        $input.value = "";
        defer.resolve(val);
    });
}

function onCloseBtn() {
    _hide().then(function () { defer.resolve(null); });
}

prompt.prompt = function (title, placeholder) {
    defer = Q.defer();
    $title.innerHTML = title;
    Q.all([
        Zanimo.transition(
            el, 'transform',
            'translate3d(0,' + (1000+height()/2) + 'px,0)',
            400, 'ease-in'
        ),
        Mask.show()
    ]).then(function () {
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

module.exports = prompt;

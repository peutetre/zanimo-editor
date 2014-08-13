/*
 * prompt.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    MobileButton = require('mobile-button'),
    $ = require('../$'),
    softkeyboard = require('../softkeyboard'),
    prompt = {},
    el = null,
    $title = null,
    $input = null,
    $okBtn = null,
    $closeBtn = null,
    okBtn = null,
    closeBtn = null,
    defer = null,
    displayed = false;

function height() { return ($.getViewportHeight()/2); }

prompt.init = function () {
    return $.getViewportHeight().then(function (height) {
        var h = height / 2;

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
        $input = $.DOM('input');
        $input.disabled = true;
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

        closeBtn = new MobileButton.Touchend({
            el: $closeBtn,
            f: onCloseBtn,
            autobind: false
        });
        okBtn = new MobileButton.Touchend({
            el: $okBtn,
            f: onOkBtn,
            autobind: false
        });

        window.addEventListener('keyup', function (evt) {
            if(evt.keyCode === 27 && displayed) onCloseBtn(evt);
            if(evt.keyCode === 13 && displayed) onOkBtn(evt);
        });

        return Q.resolve(el);
    });
};

function _hide() {
    softkeyboard.hide();
    $input.disabled = true;
    return Q.all([
        Zanimo(
            el, 'transform',
            'translate3d(0,0,0)',
            400,
            'ease-in'
        ),
        Mask.hide()
   ]).then(function () {
        displayed = false;
        closeBtn.unbind();
        okBtn.unbind();
    });
}

function ok() {
    var val = $input.value ? $input.value.trim() : "";
    $input.value = "";
    defer.resolve(val);
}

function onOkBtn(evt) {
    if(evt.stopPropagation) evt.stopPropagation();
    return _hide().then(ok, ok);
}

function close() {
    $input.value = "";
    defer.resolve(null);
}

function onCloseBtn(evt) {
    if(evt.stopPropagation) evt.stopPropagation();
    return _hide().then(close, close);
}

prompt.prompt = function (title, placeholder) {
    defer = Q.defer();
    $title.innerHTML = title;
    Q.all([
        Zanimo(
            el, 'transform',
            'translate3d(0,1030px,0)',
            400, 'ease-in'
        ).then(function () {
            $input.disabled = false; $input.focus();
        }),
        Mask.show()
    ]).then(function () {
        displayed = true;
        closeBtn.bind();
        okBtn.bind();
    });
    return defer.promise;
}

module.exports = prompt;

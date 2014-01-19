/*
 * confirm.js
 */

var Q = require('q'),
    Mask = require('mask'),
    Zanimo = require('zanimo'),
    MobileButton = require('mobile-button'),
    $ = require('../$'),
    softkeyboard = require('../softkeyboard'),
    confirm = {},
    el = null,
    $title = null,
    $msg = null,
    $okBtn = null,
    $closeBtn = null,
    okBtn = null,
    closeBtn = null,
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
    el.style.height = '150px';
    el.style.opacity = 1;
    el.style.zIndex = 11;
    $title = $.DOM('h2');
    $msg = $.DOM('div');
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

    if($.isTouchable) {
        closeBtn = new MobileButton.Touchend({
            el: $closeBtn,
            f: onCloseBtn
        });
        okBtn = new MobileButton.Touchend({
            el: $okBtn,
            f: onOkBtn
        });
    }

    window.addEventListener('keyup', function (evt) {
        if(evt.keyCode === 27 && displayed) onCloseBtn(evt);
        if(evt.keyCode === 13 && displayed) onOkBtn(evt);
    });

    return Q.resolve(el);
};

function _hide() {
    softkeyboard.hide();
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
        if($.isTouchable) {
            closeBtn.unbind();
            okBtn.unbind();
        }
        else {
            $closeBtn.removeEventListener("click", onCloseBtn);
            $okBtn.removeEventListener("click", onOkBtn);
        }
    });
}

function onOkBtn(evt) {
    return _hide().then(function () {
        if(evt.stopPropagation) evt.stopPropagation();
        defer.resolve(true);
    });
}

function onCloseBtn(evt) {
    return _hide().then(function () {
        if(evt.stopPropagation) evt.stopPropagation();
        defer.resolve(false);
    });
}

confirm.confirm = function (title, msg) {
    defer = Q.defer();
    $title.innerHTML = title;
    $msg.innerHTML = msg;
    Q.all([
        Zanimo(
            el, 'transform',
            'translate3d(0,' + (1000+10) + 'px,0)',
            400, 'ease-in'
        ),
        Mask.show()
    ]).then(function () {
        displayed = true;
        if($.isTouchable) {
            closeBtn.bind();
            okBtn.bind();
        }
        else {
            $closeBtn.addEventListener("click", onCloseBtn);
            $okBtn.addEventListener("click", onOkBtn);
        }
    });
    return defer.promise;
}

module.exports = confirm;

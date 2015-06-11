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
    $okLink = null,
    $closeBtn = null,
    okBtn = null,
    closeBtn = null,
    defer = null,
    displayed = false;

confirm.init = function () {
    return $.getViewportHeight().then(function (height) {

        var h = height / 2;

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
        $okLink = $.DOM('a');
        $okLink.style.display = 'none';
        $okLink.innerHTML = 'YES';
        $okLink.className = 'ok';
        el.appendChild($title);
        el.appendChild($msg);
        el.appendChild($closeBtn);
        el.appendChild($okBtn);
        el.appendChild($okLink);
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
        if(!link) okBtn.unbind();
    });
}

function resolve(flag) {
    return function () { defer.resolve(flag); }
}

function onOkBtn(evt) {
    if(evt.stopPropagation) evt.stopPropagation();
    return _hide().then(resolve(true), resolve(true));
}

function onCloseBtn(evt) {
    if(evt.stopPropagation) evt.stopPropagation();
    return _hide().then(resolve(false), resolve(false));
}

confirm.confirm = function (title, msg, link) {
    defer = Q.defer();
    $title.innerHTML = title;
    $msg.innerHTML = msg;

    if(link) {
        $okLink.href = link;
        $okBtn.style.display = 'none';
        $okLink.style.display = 'block';
    } else {
        $okBtn.style.display = 'block';
        $okLink.style.display = 'none';
    }

    Q.all([
        Zanimo(
            el, 'transform',
            'translate3d(0,1030px,0)',
            400, 'ease-in'
        ),
        Mask.show()
    ]).then(function () {
        displayed = true;
        closeBtn.bind();
        if(!link) okBtn.bind();
    });
    return defer.promise;
}

module.exports = confirm;

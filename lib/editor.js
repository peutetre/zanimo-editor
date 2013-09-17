/*
 * editor.js
 */

"use strict";

var Zanimo = require('zanimo'),
    Qimage = require('qimage'),
    Q = require('q'),

    $ = require('./$'),
    data = require('./data'),
    user = require('./user'),
    notification = require('./notification'),
    runner = require('./runner'),

    editor = {},

    current = null,
    type = null,
    lastEditorTouchTS = 0,
    pause = false,
    _editor,
    codeMirror = window.CodeMirror || {},

    $editor,
    $hidden,
    $select,
    $playBtn,
    $saveBtn,
    $trashBtn,
    $signBtn,
    $logoutBtn,
    $shareBtn;

if ($.isMobile) {
    var cm = { el : null };
    codeMirror = {};
    codeMirror.fromTextArea = function (el, options) {
        cm.el = el; return cm;
    };
    cm.getValue = function () { return cm.el.value; };
    cm.setValue = function (code) { cm.el.value = code; };
}

editor.init = function () {
    $hidden = $.$("#hidden-a");
    $editor = $.$("article.editor");
    $select = $.$("select", $editor);
    $playBtn = $.$("button.icon-play", $editor);
    $saveBtn = $.$("button.icon-save", $editor);
    $trashBtn = $.$("button.icon-trash", $editor);
    $signBtn = $.$("button.sign", $editor);
    $logoutBtn = $.$("button.logout", $editor);
    $shareBtn = $.$("button.icon-share", $editor);

    _editor = codeMirror.fromTextArea($.$("textarea", $editor), {
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        extraKeys: { "Enter" : "newlineAndIndentContinueComment" }
    });

    data.first(data.types[0]).then(function (d) {
        editor.set(d, data.types[0]);
    });

    if($.isTouchable) $editor.addEventListener("touchstart", editor.onTouchStart);
    $playBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onPlay);
    $saveBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onSave);
    $trashBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onTrash);
    $signBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onSign);
    $logoutBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onLogout);
    $shareBtn.addEventListener($.isTouchable ? "touchstart" : "click", editor.onShare);
    $select.addEventListener("change", editor.onSelect);
    window.document.addEventListener("keydown", editor.onKeydown);
};

editor.pause = function () {
    pause = true;
    return Q(true);
};

editor.onKeydown = function (evt) {
    if((evt.metaKey || evt.ctrlKey) && evt.keyCode === 83) {
        evt.preventDefault();
        editor.onSave();
    }
    if((evt.metaKey || evt.ctrlKey) && evt.keyCode === 69) {
        evt.preventDefault();
        editor.onPlay();
    }
}

editor.onTouchStart = function (evt) {
    var t = (new Date()).getTime();
    if((t-lastEditorTouchTS) < 400) $hidden.focus();
    lastEditorTouchTS = t;
};

editor.onPlay = function (evt) {
    if (pause) return;
    $hidden.focus();
    runner.run(_editor.getValue());
};

editor.onShare = function (evt) {
    notification.fail("✗ not implemented...", 1000);
};

editor.onSave = function (evt) {
    if (pause) return;
    $hidden.focus();
    return data.save(current, type, _editor.getValue())
        .then(notification.successƒ(), notification.fail);
};

editor.onTrash = function (evt) {
    $hidden.focus();
    var old = current;
    return data.del(current, type)
        .then(function () {
            data.first(data.types[0]).then(function (d) {
                editor.set(d, data.types[0]);
            });
        })
        .then(notification.successƒ("✓ gist" + old +" deleted"), notification.fail);
};

editor.onSign = function (evt) {
    editor.pause();
    user.authenticate();
};

editor.showLogoutBtn = function (u) {
    return Qimage(u.avatar_url)
        .then(function (img){
            $logoutBtn.innerHTML = "";
            $logoutBtn.appendChild(img);
            return $logoutBtn;
        })
        .then(function (el) {
            el.style.opacity = 0;
            el.style.zIndex = 9;
            return el;
        })
        .then(function (el) {
            return Q.all([
                Q.delay(el, 50).then(Zanimo.all([
                    Zanimo.transitionf('transform', 'rotate(360deg)', 200, 'ease-in-out'),
                    Zanimo.transitionf('opacity', 1, 200, 'ease-in')
                ])),
                Zanimo.transition($signBtn, 'opacity', 0, 200, 'ease-in-out')
            ]);
        });
};

editor.showLoginBtn = function () {
    return Q.all([
        Zanimo.transition($logoutBtn, 'transform', 'rotate(0deg)', 200, 'ease-in-out'),
        Zanimo.transition($logoutBtn, 'opacity', 0, 200, 'ease-in'),
        Q.delay($signBtn, 50).then(Zanimo.transitionf('opacity', 1, 200, 'ease-in-out'))
    ]).then(function () { $logoutBtn.style.zIndex = 1; });
};

editor.onLogout = function (evt) {
    return editor.pause()
            .then(user.logout)
            .then(editor.showLoginBtn)
            .then(function () {
                pause = false;
                return notification.success('✓ github logout', 1000);
            });
};

editor._sync = function () {
    return data.sync()
        .then(function () {
             return data
                .first(data.types[0])
                .then(function (d) { return editor.set(d, data.types[0]); });
        })
        .then(notification.successƒ("✓ gists sync "), function (err) {
            notification.fail(err);
            setTimeout(function () { $select.value = current; }, 30);
        });
};

editor._create = function (input, cmd) {
    return data
        .create(input, cmd)
        .then(function (id) { editor.set(id, cmd); });
};

editor._input = function (msg, cmds) {
    var input = window.prompt(msg, "...");
        input = input ? input.trim() : null;
    if (input in cmds || !input) return Q.reject("✗ Invalid name...");
    return Q.resolve(input);
};

editor._select = function (evt, commands, sections) {
    var name = evt.target.value.trim();

    if (name === "New Local Script") {
        return editor
            ._input("Animation name:", commands)
            .then(function (input) { return editor._create(input, commands[name]); });
    }

    if(name === "New Gist Script") {
        if(!user.islogged()) return Q.reject("✗ Github auth needed!");
        return editor
            ._input("Gist description:", commands)
            .then(function (input) { return editor._create(input, commands[name]);});
    }

    if(name === "Sync Zanimo Gists") return editor._sync();

    type = sections[evt.target.selectedOptions[0].parentNode.label];
    editor.set(name, type);
    return Q.resolve(name);
};

editor.onSelect = function (evt) {

    $hidden.focus();
    editor._select(
        evt,
        {
            "New Local Script" : "local",
            "New Gist Script" : "gist",
            "Sync Zanimo Gists" : "sync"
        },
        {
            "Demos" : "demo",
            "Local Scripts" : "local",
            "Gists" : "gist"
        }
    )
    .then(function () {}, function (err) {
        notification.fail(err);
        setTimeout(function () { $select.value = current; }, 30)
    });
};

editor.populateSelect = function (name, type) {
    var demoItems = data.list(data.types[0]),
        localItems = data.list(data.types[1]),
        gistItems = data.list(data.types[2]),
        createOption = function (val, container) {
            var op = $.DOM("option");
            op.innerHTML = val;
            op.value = val;
            container.appendChild(op);
            return op;
        },
        optgroupCommands = $.DOM("optgroup"),
        optgroupDemos = $.DOM("optgroup"),
        optgroupLocal = $.DOM("optgroup"),
        optGroupGists = $.DOM("optgroup");

    return Q.all([demoItems, localItems, gistItems])
        .spread(function (demoitems, localitems, gistitems) {
            $select.innerHTML = "";

            optgroupCommands.label = "Commands";
            optgroupDemos.label = "Demos";
            optgroupLocal.label = "Local Scripts";
            optGroupGists.label = "Gists";

            $select.appendChild(optgroupCommands);
            createOption("New Local Script", optgroupCommands);
            createOption("New Gist Script", optgroupCommands);
            createOption("Sync Zanimo Gists", optgroupCommands);

            $select.appendChild(optgroupDemos);
            demoitems.forEach(function (ex) {
                var op = createOption(ex, optgroupDemos);
                if (ex == name) op.selected = "selected";
            });

            $select.appendChild(optgroupLocal);
            localitems.forEach(function (ex) {
                var op = createOption(ex, optgroupLocal);
                if (ex == name) op.selected = "selected";
            });

            $select.appendChild(optGroupGists);
            gistitems.forEach(function (ex) {
                var op = createOption(ex, optGroupGists);
                if (ex == name) op.selected = "selected";
            });
        });
};

editor.set = function (name, t) {
    return data.get(name, t).then(function (code) {
        editor.populateSelect(name, t);
        _editor.setValue(code);
        type = t; current = name;
    }, function (err) {
        if(err.error && err.request) {
            notification.fail("✗ "
                + err.error + " "
                + t + " " + name + " "
                + err.request.statusText.toLowerCase()
            );
        }
        else {
            notification.fail(err);
        }
        editor.populateSelect(current, type);
        setTimeout(function () { $select.value = current; }, 30);
    });
};

editor.getValue = function () { return _editor.getValue(); };

module.exports = editor;

/*
 * editor.js
 */

"use strict";

var Zanimo = require('zanimo'),
    Qimage = require('qimage'),
    Qajax = require('qajax'),
    Q = require('q'),

    $ = require('./$'),
    data = require('./data'),
    user = require('./user'),
    notification = require('./notification'),
    prompt = require('./overlays/prompt'),
    runner = require('./runner'),

    editor = {},

    current = null,
    current_type = null,
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
    $shareBtn = $.$("button.icon-share-sign", $editor);

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
    return Q.resolve(true);
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

editor._createGistFromScript = function () {
    var code = _editor.getValue();
    return data.save(current, current_type, _editor.getValue())
        .then(function () { return data.create(current, 'gist', code); })
        .then(function (id) { return editor.set(id, 'gist'); })
        .then(notification.infoƒ("✓ gist created", 1000), function (err) {
            notification.fail($.formatError(err));
            setTimeout(function () { $select.value = current; }, 30);
        });
};

editor._shareOnTwitter = function () {
    var targetUrl = encodeURIComponent("http://zanimo.us/?gist=" + current),
        text = encodeURIComponent('a zanimo.js animation! '),
        url = 'https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Fzanimo.us&text=' 
            + text + '&tw_p=tweetbutton&url=' + targetUrl;
    window.open(url);
};

editor.onShare = function (evt) {
    switch(current_type) {
        case "local" :
            return editor._createGistFromScript();
        case "gist" :
            return editor._shareOnTwitter();
        default:
            return notification.fail("✗ Oops, not possible", 1000);
    }
};

editor.onSave = function (evt) {
    if (pause) return;
    $hidden.focus();
    return data.save(current, current_type, _editor.getValue())
        .then(notification.successƒ(), notification.fail);
};

editor.onTrash = function (evt) {
    $hidden.focus();
    var old = current;
    return data.del(current, current_type)
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
                .then(function (d) {
                    editor.set(d, data.types[0]);
                    return Q.resolve("✓ gists sync ");
                });
        });
};

editor._create = function (input, cmd, val) {
    return data
        .create(input, cmd, val)
        .then(function (id) { editor.set(id, cmd); });
};

editor._input = function (msg, cmds) {
    return prompt.prompt(msg, "...").then(function (input) {
        return Q.all([ data.list(data.types[0]), data.list(data.types[1])])
            .spread(function (demoList, localList) {
                var nameAvailable = true;
                demoList.forEach(function (item) {
                    if (item === input) nameAvailable = false;
                });
                localList.forEach(function (item) {
                    if (item === input) nameAvailable = false;
                });
                if (!input) return Q.reject("✗ Cancel...");
                if (!nameAvailable) return Q.reject("✗ Invalid input...");
                return Q.resolve(input);
            });
    });
};

editor._select = function (evt, commands, sections) {
    var name = evt.target.value.trim(),
        idx = evt.target.selectedIndex;
    switch(name) {
        case "New Local Script":
            return editor
                ._input("Animation name", commands)
                .then(function (input) { return editor._create(input, commands[name]); });
        case "New Gist Script":
            return editor
                ._input("Gist description", commands)
                .then(function (input) { return editor._create(input, commands[name]);});
        case "Sync Zanimo Gists":
            return editor._sync();
        default:
            current_type = sections[$select.options[idx].parentNode.label];
            return editor.set(name, current_type);
    }
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
    .then(notification.success, function (err) {
        notification.fail($.formatError(err));
        setTimeout(function () { $select.value = current; }, 30);
    });
};

editor.populateSelect = function (name) {
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

editor.refreshSelect = function (arg) {
    editor.populateSelect(current);
    return arg;
};

editor.set = function (name, t) {
    return data.get(name, t).then(function (code) {
        editor.populateSelect(name);
        _editor.setValue(code);
        current_type = t; current = name;
        return;
    }, function (err) {
        editor.populateSelect(current);
        setTimeout(function () { $select.value = current; }, 30);
        throw  err;
    });
};

editor.importGistAsLocalScript = function (id) {
    var defer = Q.defer(),
        url = "https://api.github.com/gists/";

    history.pushState("", document.title, window.location.pathname);

    Qajax.getJSON(url + id.trim())
        .then(function (gist) {
            if (gist.files['zanimo-animation.js']) {
                var code = gist.files['zanimo-animation.js']['content'];
                editor._create('local-' +id, 'local', code);
                defer.resolve(code);
            }
            else {
                defer.reject("✗ Invalid gist format...");
            }
        }, function (err) {
            defer.reject("✗ Can not fetch gist!");
        });
    return defer.promise;
};

editor.getValue = function () { return _editor.getValue(); };

module.exports = editor;

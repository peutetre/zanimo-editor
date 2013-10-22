/*
 * editor.js
 */

"use strict";

var Zanimo = require('zanimo'),
    Qimage = require('qimage'),
    Qajax = require('qajax'),
    Q = require('q'),
    Image2Base64 = require('image2base64'),
    storage = window.localStorage,

    pkg = require('../package.json'),
    $ = require('./$'),
    data = require('./data'),
    user = require('./user'),
    curtain = require('./curtain'),
    notification = require('./notification'),
    prompt = require('./overlays/prompt'),
    confirm = require('./overlays/confirm'),
    alert = require('./overlays/alert'),
    runner = require('./runner'),
    softkeyboard = require('./softkeyboard'),

    editor = {},

    current = null,
    current_type = null,
    lastEditorTouchTS = 0,
    pause = false,
    _editor,
    codeMirror = window.CodeMirror || {},
    emptyScript = null,

    $editor,
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

    emptyScript = $.$("#empty-script-help").innerHTML;

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
    if((t-lastEditorTouchTS) < 400) softkeyboard.hide();
    lastEditorTouchTS = t;
};

editor.onPlay = function (evt) {
    if (evt) evt.preventDefault();
    if (pause) return;
    softkeyboard.hide();
    runner.run(_editor.getValue());
};

editor._createGistFromScript = function () {
    var code = _editor.getValue();
    return data.save(current, current_type, _editor.getValue())
        .then(function () { return data.create('gist-'+current, 'gist', code); })
        .then(function (id) { return editor.set(id, 'gist'); })
        .then(notification.infoƒ("✓ gist created", 1000), function (err) {
            notification.fail($.formatError(err));
            setTimeout(function () { $select.value = current; }, 30);
        });
};

editor._shareOnTwitter = function () {
    var text = encodeURIComponent('a @zanimojs animation! '),
        targetUrl, url;

    data.getInfo(current, "gist").then(function (id) {
        targetUrl = encodeURIComponent("http://zanimo.us/?gist=" + id);
        url = 'https://twitter.com/share?text=' + text + '&url=' + targetUrl;
        window.open(url);
    });
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
    softkeyboard.hide()
    return data.save(current, current_type, _editor.getValue())
        .then(notification.successƒ(), notification.fail);
};

editor.onTrash = function (evt) {
    softkeyboard.hide()
    var old = current,
        old_type = current_type;
    return confirm.confirm("Delete", "Do you really want to delete " + current_type + " script " + current + " ?")
        .then(function (rst) { if (rst) return; else return Q.reject("✗ Cancel..."); })
        .then(function () { return data.del(current, current_type); })
        .then(function () {
            data.first(data.types[0])
                .then(function (name) {
                    editor.set(name, data.types[0]);
                });
        })
        .then(
            notification.successƒ("✓ " + old_type + " " + old + " deleted"),
            notification.fail
        );
};

editor.onSign = function (evt) {
    editor.pause();
    confirm.confirm("Github Signin", "Do you want to signin with Github to sync Zanimo Gists?")
        .then(function (rst) { if(rst) return; else return Q.reject("✗ Cancel..."); })
        .then(user.authenticate, notification.fail);
};

editor._createImageAvatar = function (u) {
    var avatarBase64 = storage.getItem('zaeun-' + u.login);
    if(avatarBase64) {
        var image = new window.Image();
        image.src = avatarBase64;
        return Q.resolve(image);
    }
    else {
        return Qimage(u.avatar_url, { crossorigin: "Anonymous" })
            .then(function (img) {
                storage.setItem(
                    'zaeun-' + u.login,
                    Image2Base64(img)
                );
                return img;
            });
    }
};

editor.showLogoutBtn = function (u) {
    return editor._createImageAvatar(u)
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
                if (typeof input === 'string' && input.length === 0)
                    return Q.reject("✗ Invalid input...");
                if (!input)
                    return Q.reject("✗ Cancel...");
                if (!nameAvailable)
                    return Q.reject("✗ Script name already exists...");
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
                .then(function (input) { return editor._create(input, commands[name], emptyScript); });
        case "New Gist Script":
            return editor
                ._input("Gist description", commands)
                .then(function (input) { return editor._create(input, commands[name], emptyScript);});
        case "Sync Zanimo Gists":
            return confirm.confirm("Gist sync", "Do you want to synchronize gists? (strategy: last updated wins!)").then(function (rst) {
                if (rst) return editor._sync();
                else return Q.reject("✗ Cancel...");
            });
        case "Help":
            return curtain.animate()
                .then(function () {
                    setTimeout(function () { $select.value = current; }, 30);
                });
        case "About":
            return editor.showAbout()
                .then(function () {
                    setTimeout(function () { $select.value = current; }, 30);
                });
        default:
            current_type = sections[$select.options[idx].parentNode.label];
            return editor.set(name, current_type);
    }
};

editor.showAbout = function () {
    return alert.show('About',
        '<b>Zanimo-editor v' + pkg.version
        + '</b> featuring <b>Zanimo v' + pkg.dependencies.zanimo
        + '</b> and <b>Q v' + pkg.dependencies.q + '</b><br>'
        + 'Create Animations with styled CSS3 transitions right in your device!'
    );
};

editor.onSelect = function (evt) {

    softkeyboard.hide()
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
        gistItems = data.list(data.types[2])
            .then(function (l) { return l; }, function () { return []; }),
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
            createOption("Help", optgroupCommands);
            createOption("About", optgroupCommands);

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

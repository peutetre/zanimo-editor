/*
 * editor.js
 */

"use strict";

var editor = {},
    Zanimo = require('zanimo'),
    Qimage = require('qimage'),
    Q = require('q'),
    _$ = require('./$'),
    store = require('./store'),
    user = require('./user'),
    notification = require('./notification'),
    runner = require('./runner');

var EMPTY_SCRIPT,
    currentScript = 0,
    lastEditorTouchTS = 0,
    pause = false,
    _editor,
    $editor,
    $hidden,
    $select,
    $playBtn,
    $saveBtn,
    $trashBtn,
    $signBtn,
    $logoutBtn,
    $shareBtn,
    codeMirror = window.CodeMirror || {};

if (_$.isMobile) {
    var cm = { el : null };
    codeMirror = {};
    codeMirror.fromTextArea = function (el, options) {
        cm.el = el; return cm;
    };
    cm.getValue = function () { return cm.el.value; };
    cm.setValue = function (code) { cm.el.value = code; };
}

editor.init = function () {
    $hidden = _$.$("#hidden-a");
    $editor = _$.$("article.editor");
    $select = _$.$("select", $editor);
    $playBtn = _$.$("button.icon-play", $editor);
    $saveBtn = _$.$("button.icon-save", $editor);
    $trashBtn = _$.$("button.icon-trash", $editor);
    $signBtn = _$.$("button.sign", $editor);
    $logoutBtn = _$.$("button.logout", $editor);
    $shareBtn = _$.$("button.icon-share", $editor);

    _editor = codeMirror.fromTextArea(_$.$("textarea", $editor), {
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        extraKeys: { "Enter" : "newlineAndIndentContinueComment" }
    });

    EMPTY_SCRIPT = _$.$("#empty-script-help").innerHTML;

    currentScript = store.head();
    editor.populateSelect(currentScript, store);
    editor.loadExample(currentScript, store);

    if(_$.isTouchable) $editor.addEventListener("touchstart", editor.onTouchStart);
    $playBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onPlay);
    $saveBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onSave);
    $trashBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onTrash);
    $signBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onSign);
    $logoutBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onLogout);
    $shareBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onShare);
    $select.addEventListener("change", editor.onSelect);
    window.document.addEventListener("keydown", editor.onKeydown);
};

editor.pause = function () {
    pause = true;
    return Q.resolve();
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
    if(!store.save($select.value, _editor.getValue()))
        notification.fail("Can't overwrite example script!");
    else notification.success();
};

editor.onTrash = function (evt) {
    $hidden.focus();
    if (store.isDefaultExample($select.value)) {
        notification.fail("Can't delete example script!");
        return;
    }
    if(confirm("Delete " + $select.value + " ?")) {
        store.trash($select.value);
        var head = store.head();
        if(currentScript === $select.value) currentScript = head;
        editor.populateSelect(head, store);
        editor.loadExample(head, store);
    }
};

editor.onSign = function (evt) {
    editor.pause();
    user.authenticate();
};

editor.showLogoutBtn = function (user) {
    return Qimage(user.avatar_url)
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

editor.add = function (name, code) {
    if (store.save(name, code)) {
        _editor.setValue(code);
        editor.populateSelect(name, store);
        $select.value = name;
        currentScript = name;
        return true;
    }
    else {
        $select.value = currentScript;
        notification.fail("Can't overwrite example script!");
        window.setTimeout(function () {
            $select.value = currentScript;
        },10);
        return false;
    }
};

editor.onSelect = function (evt) {
    $hidden.focus();

    if(evt.target.value === "New Local Script") {
        var name = window.prompt("Script name:", "my-test"),
            trimedName = "";
        if (name && name.length > 0 && name.trim() !== "New") {
            trimedName = name.trim().replace(/ /g, '_').replace(/-/g, '_');
            editor.add(trimedName, EMPTY_SCRIPT);
        }
        else {
            if (name != null) notification.fail("Script name is invalid!");
            setTimeout(function () {
                $select.value = currentScript;
            },30);
        }
    } else if (evt.target.value === "New Gist Script" || evt.target.value === "Sync Zanimo Gists") {
        notification.fail("✗ not implemented...", 1000);
        setTimeout(function () { $select.value = currentScript; },30);
    } else {
        editor.loadExample(evt.target.value, store);
        currentScript = evt.target.value;
    }
};

editor.populateSelect = function (name) {
    var items = store.getList(),
        exampleScripts = items.filter(function (ex) {
            return store.isDefaultExample(ex);
        }),
        userScripts = items.filter(function (ex) {
            return !store.isDefaultExample(ex);
        }),
        createOption = function (val, container) {
            var op = _$.DOM("option");
            op.innerHTML = val;
            op.value = val;
            container.appendChild(op);
            return op;
        },
        optgroupCommands = _$.DOM("optgroup"),
        optgroupDemos = _$.DOM("optgroup"),
        optgroupLocal = _$.DOM("optgroup"),
        optGroupGists = _$.DOM("optgroup");

    $select.innerHTML = "";
    optgroupCommands.label = "Commands";
    optgroupDemos.label = "Demos";
    optgroupLocal.label = "Local Scripts";
    optGroupGists.label = "Gists";
    $select.appendChild(optgroupCommands);
    createOption("New Local Script", $select);
    createOption("New Gist Script", $select);
    createOption("Sync Zanimo Gists", $select);
    $select.appendChild(optgroupDemos);
    exampleScripts.forEach(function (ex) {
        var op = createOption(ex, $select);
        if (ex == name) op.selected = "selected";
    });
    $select.appendChild(optgroupLocal);
    userScripts.forEach(function (script) {
        var op = createOption(script, $select);
        if (script == name) op.selected = "selected";
    });
    $select.appendChild(optGroupGists);
    // TODO add gists
};

editor.loadExample = function (name) { _editor.setValue(store.get(name)); };

editor.setScript = function (a) {
    console.log('editor.setScript', a);
};

editor.getValue = function () { return _editor.getValue(); };

module.exports = editor;

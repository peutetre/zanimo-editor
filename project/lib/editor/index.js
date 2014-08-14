/*
 * index.js
 */

"use strict";

var Zanimo = require('zanimo'),
    Qanimationframe = require('qanimationframe'),
    Qimage = require('qimage'),
    Qajax = require('qajax'),
    Q = require('q'),
    Image2Base64 = require('image2base64'),
    MobileButton = require('mobile-button'),
    storage = window.localStorage,

    menu = require('./menu'),
    pkg = require('../../package.json'),
    settings = require('settings'),
    $ = require('../$'),
    data = require('../data'),
    user = require('../user'),
    curtain = require('../curtain'),
    notification = require('../notification'),
    prompt = require('../overlays/prompt'),
    confirm = require('../overlays/confirm'),
    alert = require('../overlays/alert'),
    runner = require('../runner'),
    softkeyboard = require('../softkeyboard'),
    emptyScript = $.$('#empty-script-code').innerHTML,

    editor = {},

    current = null,
    current_type = null,
    lastEditorTouchTS = 0,
    pause = false,
    _editor,
    codeMirror = window.CodeMirror || {},
    aboutContentHTML = null,

    commands = {
        newlocalscript: "New Local Script",
        newpublicgist: "New Public Gist Script",
        newprivategist: "New Private Gist Script",
        sync: "Sync Zanimo Gists",
        help: "Help",
        about: "About"
    },
    sections = [
        "demo",
        "local",
        "publicgist",
        "privategist"
    ],

    $editor,
    $textarea,
    $signBtn,
    $logoutBtn;

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
    $textarea = $.$("textarea", $editor);
    $signBtn = $.$("button.sign", $editor);
    $logoutBtn = $.$("button.logout", $editor);


    _editor = codeMirror.fromTextArea($textarea, {
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        extraKeys: { "Enter" : "newlineAndIndentContinueComment" }
    });

    menu.init(editor.onSelect, {
        commands : commands,
        sections : sections
    });

    data.first(data.types[0]).then(function (d) {
        editor.set(d, data.types[0]);
    });

    aboutContentHTML = $.$(window.cordova ? "#about-content-cordova" : "#about-content").innerHTML;
    aboutContentHTML = aboutContentHTML.replace(/\{\{0\}\}/, settings.version)
        .replace(/\{\{1\}\}/, pkg.dependencies.zanimo)
        .replace(/\{\{2\}\}/, pkg.dependencies.q);

    if($.isTouchable) {
        $editor.addEventListener("touchstart", editor.onTouchStart);
    }

    (new MobileButton.Touchend({
        el: $.$("button.icon-play", $editor), f: editor.onPlay
    }));
    (new MobileButton.Touchend({
        el: $.$("button.icon-save", $editor), f: editor.onSave
    }));
    (new MobileButton.Touchend({
        el: $.$("button.icon-trash", $editor), f: editor.onTrash
    }));
    (new MobileButton.Touchend({
        el: $signBtn, f: editor.onSign
    }));
    (new MobileButton.Touchend({
        el: $logoutBtn, f: editor.onLogout
    }));

    if($.isWPCordova) {
        $.$("button.icon-share-sign").style.display = 'none';
    }
    else {
        (new MobileButton.Touchend({
            el: $.$("button.icon-share-sign", $editor), f: editor.onShare
        }));
    }

    window.document.addEventListener("keydown", editor.onKeydown);

    if(window.cordova) {
        $textarea.addEventListener('focus', menu.hide);
    }

    if(window.cordova && window.cordova.platformId === 'ios') {
        window.Keyboard.onshow = window.Keyboard.onhide = function () {
            if(window.Keyboard.isVisible) menu.hide();
            Qanimationframe(function () {
                $textarea.style.webkitOverflowScrolling = 'auto';
                return $textarea;
            }).then(function (el) {
                el.style.webkitOverflowScrolling = 'touch';
            });
        };
    }
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
    menu.hide().then(function () {
        runner.run(_editor.getValue());
    });
};

editor._createGistFromScript = function () {
    var code = _editor.getValue();
    return data.save(current, current_type, _editor.getValue())
        .then(function () { return data.create('gist-'+current, 'publicgist', code); })
        .then(function (id) { return editor.set(id, 'publicgist'); })
        .then(notification.infoƒ("✓ gist created", 1000), function (err) {
            notification.fail($.formatError(err));
            menu.set(current);
        });
};

editor._shareOnTwitter = function () {
    var text = 'a @zanimojs animation!',
        targetUrl, url;
    data.getInfo(current, "publicgist").then(function (id) {
        targetUrl = "http://zanimo.us/?gist=" + id;
        if (window.cordova) {
            window.socialmessage.send({
                text: text,
                url: targetUrl,
                activityTypes: ["PostToTwitter", "Mail"]
            });
        } else {
            text = encodeURIComponent(text);
            targetUrl = encodeURIComponent(targetUrl);
            url = 'https://twitter.com/share?text=' + text + '&url=' + targetUrl;
            window.location = url;
        }
    });
};

editor.onShare = function (evt) {
    softkeyboard.hide();
    menu.hide();
    switch(current_type) {
        case "local" :
            return editor._createGistFromScript();
        case "publicgist" :
            return editor._shareOnTwitter();
        case "privategist" :
            return notification.fail("✗ Can't share private gist", 1000);
        default:
            return notification.fail("✗ Oops, can't share that", 1000);
    }
};

editor.onSave = function (evt) {
    if (pause) return;
    softkeyboard.hide();
    menu.hide();
    return data.save(current, current_type, _editor.getValue())
        .then(notification.successƒ(), function (err) {
            notification.fail(err);
        });
};

editor.onTrash = function (evt) {
    softkeyboard.hide();
    menu.hide();
    var old = current,
        old_type = current_type;
    return confirm.confirm("Delete", "Do you really want to delete " + data.typeLabels[current_type] + " script " + current + " ?")
        .then(function (rst) { if (rst) return; else return Q.reject("✗ Cancel..."); })
        .then(function () { return data.del(current, current_type); })
        .then(function () {
            return data.first(data.types[0])
                .then(function (name) {
                    editor.set(name, data.types[0]);
                });
        })
        .then(
            notification.successƒ("✓ " + old_type + " " + old + " deleted"),
            function (err) { return notification.fail($.formatError(err)); }
        );
};

editor.onSign = function (evt) {
    editor.pause();
    softkeyboard.hide();
    menu.hide();
    confirm.confirm("Github Signin", "Do you want to signin to Github?")
        .then(function (rst) { if(rst) return; else return Q.reject("✗ Cancel..."); })
        .then(user.authenticate, notification.fail)
        .done(function () { pause = false; });
};

editor._createImageAvatar = function (u) {
    var avatarBase64 = storage.getItem('zaeun-' + u.login);
    if(avatarBase64) {
        var image = new window.Image();
        image.src = avatarBase64;
        return Q.resolve(image);
    }
    else {
        return Qimage(u.avatar_url, { crossOrigin: "Anonymous" })
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
        }, function () {
            $logoutBtn.innerHTML = "";
            return $logoutBtn;
        })
        .then(function (el) {
            el.style.opacity = 0;
            el.style.zIndex = 9;
            return el;
        })
        .then(function (elt) {
            return Q.all([
                Q.delay(elt, 50).then(function (el) {
                    return Q.all([
                        Zanimo(el, 'transform', 'rotate(360deg)', 200, 'ease-in-out'),
                        Zanimo(el, 'opacity', 1, 200, 'ease-in')
                    ]);
                }),
                Zanimo($signBtn, 'opacity', 0, 200, 'ease-in-out')
            ]);
        });
};

editor.showLoginBtn = function () {
    return Q.all([
        Zanimo($logoutBtn, 'transform', 'rotate(0deg)', 200, 'ease-in-out'),
        Zanimo($logoutBtn, 'opacity', 0, 200, 'ease-in'),
        Q.delay($signBtn, 50).then(Zanimo.f('opacity', 1, 200, 'ease-in-out'))
    ]).then(function () { $logoutBtn.style.zIndex = 1; });
};

editor.onLogout = function (evt) {
    softkeyboard.hide();
    menu.hide();
    return confirm.confirm(
            "Logout",
            "Do you want to logout ? You will lose your local gists."
        ).then(function (rst) {
            editor.pause();
            return rst ? user.logout().then(editor.showLoginBtn) : Q.reject("✗ Cancel...");
        }).then(function () {
            pause = false;
            return data.first(data.types[0])
                .then(function (name) {
                    return editor.set(name, data.types[0]);
                })
                .then(function () {
                    return notification.success('✓ github logout', 1000);
                })
        }, function (err) {
            pause = false;
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

editor._input = function (msg) {
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

editor.actions = {
    local : function () {
        return editor._input("Animation name")
            .then(function (input) { return editor._create(input, "local", emptyScript); });
    },
    publicgist : function () {
        return  editor._input("Public Gist description")
            .then(function (input) { return editor._create(input, "publicgist", emptyScript);});
    },
    privategist : function () {
        return editor._input("Private Gist description")
            .then(function (input) { return editor._create(input, "privategist", emptyScript);});
    },
    sync : function () {
        return confirm.confirm(
                "Gist sync",
                "Do you want to synchronize gists? (strategy: last updated wins!)"
            ).then(function (rst) {
                if (rst) return editor._sync();
                else return Q.reject("✗ Cancel...");
            });
    },
    help : function () {
        return curtain.animate()
            .then(function () {
                menu.set(current);
            });
    },
    about : function () {
        return alert.show('About', aboutContentHTML)
            .then(function () {
                menu.set(current);
            });
    },
    defaultAction : function (v, t) {
        current_type = t;
        return editor.set(v, t);
    }
};

editor.onSelect = function (val, typ) {
    softkeyboard.hide();
    (function () {
        switch(val) {
            case commands.newlocalscript:
                return editor.actions.local();
            case commands.newpublicgist:
                return editor.actions.publicgist();
            case commands.newprivategist:
                return editor.actions.privategist();
            case commands.sync:
                return editor.actions.sync();
            case commands.help:
                return editor.actions.help();
            case commands.about:
                return editor.actions.about();
            default:
                return editor.actions.defaultAction(val, typ);
        }
    })().then(notification.success, function (err) {
        notification.fail($.formatError(err));
        menu.set(current);
    });
};

editor.refreshSelect = function (arg) {
    menu.render(current);
    return arg;
};

editor.set = function (name, t) {
    return data.get(name, t).then(function (code) {
        menu.render(name);
        _editor.setValue(code);
        current_type = t; current = name;
        return;
    }, function (err) {
        menu.render(current);
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

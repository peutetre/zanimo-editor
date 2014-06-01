/*
 * layout.js
 */

var $ = require('./$');

function onBodyTouchmove(evt) {
    evt.preventDefault();
}

// fix layout for wp and browser with no css calc() support
function layout() {
    var dummy = $.DOM("div"),
        $doc = $.$(".documentation section.content"),
        $editor = $.$(".CodeMirror"),
        calc = null;

    ["", "-webkit-", "-moz-", "-ms-"].forEach(function (prefix) {
        var t = prefix + "calc(10px)";
        dummy.style.cssText = "width:" + t + ";";
        if(dummy.style.width === t) calc = prefix + "calc";
    });

    if($.isWPCordova) {
        window.document.body.addEventListener("touchmove", onBodyTouchmove);
        $.getViewportHeight().then(function (h) {
            window.document.documentElement.style.height = h + 'px';
        });
    }

    if (calc !== null) return;

    function fix() {
        $.getViewportHeight().then(function (h) {
            $doc.style.height = (h - 30) + "px";
            if($editor) $editor.style.height = (h - 80) + "px";
        });
    };

    if(!$.isMobile) window.addEventListener("resize", fix);
    window.addEventListener("orientationchange", fix);
    fix();
}

module.exports = layout;
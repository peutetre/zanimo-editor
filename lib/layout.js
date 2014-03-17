/*
 * layout.js
 */

var $ = require('./$');

// fix layout when no CSS calc() support available
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

    if (calc !== null) return;
    function fix() {
        var h = $.getViewportHeight();
        $doc.style.height = (h - 30) + "px";
        if($editor) $editor.style.height = (h - 80) + "px";
    };

    function onBodyTouchmove(evt) {
        evt.preventDefault();
    };

    if(!$.isTouchable) window.addEventListener("resize", fix);
    window.addEventListener("orientationchange", fix);
    window.document.body.addEventListener("touchmove", onBodyTouchmove);
    fix();
}

module.exports = layout;

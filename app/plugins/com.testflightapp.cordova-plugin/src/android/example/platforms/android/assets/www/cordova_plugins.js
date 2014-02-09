cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "phonegap/plugin/testflight/testflight.js",
        "id": "jp.wizcorp.phonegap.plugin.testflight.testflightPlugin",
        "clobbers": [
            "window.testflight"
        ]
    }
]
});
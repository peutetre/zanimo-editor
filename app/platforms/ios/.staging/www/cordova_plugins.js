cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.console/www/console-via-logger.js",
        "id": "org.apache.cordova.console.console",
        "clobbers": [
            "console"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.console/www/logger.js",
        "id": "org.apache.cordova.console.logger",
        "clobbers": [
            "cordova.logger"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.network-information/www/network.js",
        "id": "org.apache.cordova.network-information.network",
        "clobbers": [
            "navigator.connection",
            "navigator.network.connection"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.network-information/www/Connection.js",
        "id": "org.apache.cordova.network-information.Connection",
        "clobbers": [
            "Connection"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.splashscreen/www/splashscreen.js",
        "id": "org.apache.cordova.splashscreen.SplashScreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.statusbar/www/statusbar.js",
        "id": "org.apache.cordova.statusbar.statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/InAppBrowser.js",
        "id": "org.apache.cordova.inappbrowser.InAppBrowser",
        "clobbers": [
            "window.open"
        ]
    },
    {
        "file": "plugins/socialmessage/www/socialmessage.js",
        "id": "socialmessage.SocialMessage",
        "clobbers": [
            "socialmessage"
        ]
    },
    {
        "file": "plugins/com.testflightapp.cordova-plugin/www/testflight.js",
        "id": "com.testflightapp.cordova-plugin.TestFlight",
        "clobbers": [
            "TestFlight"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.keyboard/www/keyboard.js",
        "id": "org.apache.cordova.keyboard.keyboard",
        "clobbers": [
            "window.Keyboard"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "org.apache.cordova.console": "0.2.6",
    "org.apache.cordova.network-information": "0.2.6",
    "org.apache.cordova.device": "0.2.7",
    "org.apache.cordova.splashscreen": "0.2.6",
    "org.apache.cordova.statusbar": "0.1.3",
    "org.apache.cordova.inappbrowser": "0.3.0",
    "socialmessage": "0.2.3",
    "com.testflightapp.cordova-plugin": "2.0.0",
    "org.apache.cordova.keyboard": "0.1.2"
}
// BOTTOM OF METADATA
});
/*
 * creashreporter.js
 */

"use strict";

var Q = require('q'),
    tf = null;

module.exports = function reporter() {
    if (tf) return Q(tf);

    var tf = new TestFlight(),
        defer = Q.defer(),
        log = console.log,
        warn = console.log,
        error = null;

    window.console = { };
    window.console.warn = window.console.log = function (arg) {
        log(arg);
        log("oops");
        tf.remoteLog(function () {}, function () {}, arg);
    };

    tf.takeOff(function () {
        window.addEventListener('error', function (err) {
            tf.remoteLog(function () {}, function () {}, err.message + ' line number: ' + err.lineno + ' in file ' + err.filename);
            console.log('[error] ' + err.message);
        }, false);

        defer.resolve(tf);

    }, function (err) {
        defer.reject(err);
    }, 'df1d4679-8b39-436f-bb33-4568a727991c');

    return defer.promise;
};

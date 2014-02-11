/*
 * creashreporter.js
 */

"use strict";

var Q = require('q'),
    empty = require('./$').empty,
    tf = null;

module.exports = function reporter() {
    if (tf) return Q(tf);

    var tf = new TestFlight(),
        defer = Q.defer(),
        log = console.log,
        warn = console.log;

    window.console = { };
    window.console.warn = window.console.log = function () {
        var logs = Array.prototype.join.call(arguments, ', ');
        log(logs);
        tf.remoteLog(empty, empty, logs);
    };

    tf.takeOff(function () {
        window.addEventListener('error', function (err) {
            var msg = '[error] ' + err.message + ' line number: ' + err.lineno + ' in file ' + err.filename;
            tf.remoteLog(empty, empty, msg);
            window.console.log(msg);
        }, false);

        defer.resolve(tf);

    }, function (err) {
        defer.reject(err);
    }, 'df1d4679-8b39-436f-bb33-4568a727991c');

    return defer.promise;
};

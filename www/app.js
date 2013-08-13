;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
/*
 * $.js - utils
 */

exports.$ = function $(s, c) { return (c || window.document).querySelector(s); }
exports.$$ = function $$(s, c) { return (c || window.document).querySelectorAll(s); }
exports.DOM = function DOM(tag) { return window.document.createElement(tag); }
exports.empty = function empty() { }
exports.isTouchable = window.document.ontouchstart === null;

},{}],2:[function(require,module,exports){
/*
 * app.js - the Zanimo animation editor
 */

var app = {},
    VERSION = 25,
    Q = require('q'),
    qstart = require('qstart'),
    _$ = require('./$'),
    curtain = require('./curtain'),
    store = require('./store'),
    editor = require('./editor'),
    runner = require('./runner');

// fix layout when no CSS calc() support available
function fixCSSCalc() {
    var dummy = document.createElement("div"),
        calc = null;

    ["", "-webkit-", "-moz-", "-ms-"].forEach(function (prefix) {
        var t = prefix + "calc(10px)";
        dummy.style.cssText = "width:" + t + ";";
        if(dummy.style.width === t) calc = prefix + "calc";
    });

    if (calc !== null) return;

    var $doc = _$.$(".documentation section.content"),
        $content = _$.$(".documentation section.content div.doc-content"),
        $editor = _$.$(".CodeMirror"),
        fixLayout = function () {
            var h = window.innerHeight;
            $doc.style.height = (h - 30) + "px";
            $content.style.height = (h - 65) + "px";
            if($editor) $editor.style.height = (h - 80) + "px";
        };
    if(!_$.isTouchable) window.addEventListener("resize", fixLayout);
    window.addEventListener("orientationchange", fixLayout);
    fixLayout();
}

app.share = function () { editor.onShare(); };

app.show = function () {
     var hash = window.location.hash.replace(/#/, ''),
        matchRoute = hash.match(/(runner)\/(\w+)\/(\w+)/);

    switch ( matchRoute ? matchRoute[1] : "" ) {
        case "runner":
            if (editor.add(matchRoute[2], window.atob(matchRoute[3])))
                runner.run(editor.getValue());
        default:
            window.location.hash = "";
            Q.when(Q.delay(1000), function () {
                curtain.animate().then(curtain.bind)
            });
    }
};

app.init = function () {
    curtain.init();
    store.setup(VERSION);
    runner.init();
    editor.init();
    fixCSSCalc();
    app.show();
};

qstart().then(app.init);

},{"./$":1,"./curtain":3,"./store":4,"./editor":5,"./runner":6,"q":7,"qstart":8}],4:[function(require,module,exports){
/*
 * store.js - the code store
 */
var store = {},
    _$ = require('./$');

var storageKey = "zanimo-examples",
    defaultExamples = [],
    storage = window.localStorage,
    load = function () { return JSON.parse(storage.getItem(storageKey)); },
    hasKey = function () { return storage.hasOwnProperty(storageKey); };

store.setup = function (version) {
    var scripts = _$.$$("script[data-example-id]"), data = {}, output = {},
        l = scripts.length, name = null, script = null, i = 0;

    for (i; i<l; i++) {
        script = scripts.item(i);
        name = script.getAttribute("data-example-id");
        data[name] = script.innerHTML;
        defaultExamples.push(name);
    }

    if(hasKey() && parseInt(storage.getItem(storageKey+"VERSION"), 10) === version) return;
    if (hasKey()) {
        output = JSON.parse(storage.getItem(storageKey));
        for(var d in data)
            output[d] = data[d];
    }
    else {
        output = data;
    }
    storage.setItem(storageKey, JSON.stringify(output));
    storage.setItem(storageKey+"VERSION", version);
};

store.isDefaultExample = function (name) {
    return defaultExamples.indexOf(name) !== -1;
};

store.get = function (name) {
    if(!hasKey()) return;
    var data = load();
    return data[name] || "";
};

store.getList = function () {
    if(!hasKey()) return [];
    var data = load(),
        keys = [], key;
    for(key in data) { keys.push(key); }
    return keys;
};

store.save = function (name, code) {
    if (store.isDefaultExample(name)) return false;
    var data = load();
    data[name] = code;
    storage.setItem(storageKey, JSON.stringify(data));
    return true;
};

store.trash = function (name) {
    var data = load();
    delete data[name];
    storage.setItem(storageKey, JSON.stringify(data));
};

store.head = function () {
    return store.getList()[0];
};

module.exports = store;

},{"./$":1}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],7:[function(require,module,exports){
(function(process){// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    domain && domain.exit();
                    setTimeout(flush, 0);
                    domain && domain.enter();

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        requestTick = function () {
            channel.port2.postMessage(0);
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this does have the nice side-effect of reducing the size
// of the code by reducing x.call() to merely x(), eliminating many
// hard-to-minify characters.
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
function uncurryThis(f) {
    var call = Function.call;
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
// engine that has a deployed base of browsers that support generators.
// However, SM's generators use the Python-inspired semantics of
// outdated ES6 drafts.  We would like to support ES6, but we'd also
// like to make it possible to use generators in deployed browsers, so
// we also support Python-style generators.  At some point we can remove
// this block.
var hasES6Generators;
try {
    /* jshint evil: true, nonew: false */
    new Function("(function* (){ yield 1; })");
    hasES6Generators = true;
} catch (e) {
    hasES6Generators = false;
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Creates fulfilled promises from non-thenables,
 * Passes Q promises through,
 * Coerces other thenables to Q promises.
 */
function Q(value) {
    return resolve(value);
}

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = deprecate(function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    }, "valueOf", "inspect");

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(resolve(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }

    var deferred = defer();
    fcall(
        resolver,
        deferred.resolve,
        deferred.reject,
        deferred.notify
    ).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = deprecate(function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        });
    }

    return promise;
}

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Promise.prototype.thenResolve = function (value) {
    return when(this, function () { return value; });
};

Promise.prototype.thenReject = function (reason) {
    return when(this, function () { throw reason; });
};

// Chainable methods
array_reduce(
    [
        "isFulfilled", "isRejected", "isPending",
        "dispatch",
        "when", "spread",
        "get", "set", "del", "delete",
        "post", "send", "mapply", "invoke", "mcall",
        "keys",
        "fapply", "fcall", "fbind",
        "all", "allResolved",
        "timeout", "delay",
        "catch", "finally", "fail", "fin", "progress", "done",
        "nfcall", "nfapply", "nfbind", "denodeify", "nbind",
        "npost", "nsend", "nmapply", "ninvoke", "nmcall",
        "nodeify"
    ],
    function (undefined, name) {
        Promise.prototype[name] = function () {
            return Q[name].apply(
                Q,
                [this].concat(array_slice(arguments))
            );
        };
    },
    void 0
);

Promise.prototype.toSource = function () {
    return this.toString();
};

Promise.prototype.toString = function () {
    return "[object Promise]";
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        !window.Touch &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        if (reason && typeof reason.stack !== "undefined") {
            console.warn("Unhandled rejection reason:", reason.stack);
        } else {
            console.warn("Unhandled rejection reason (no stack):", reason);
        }
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    unhandledReasons.push(reason);
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisP, args) {
            return value.apply(thisP, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
Q.resolve = resolve;
function resolve(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return resolve(object).inspect();
    });
}

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(promise, fulfilled, rejected) {
    return when(promise, function (valuesOrPromises) {
        return all(valuesOrPromises).then(function (values) {
            return fulfilled.apply(void 0, values);
        }, rejected);
    }, rejected);
}

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            if (hasES6Generators) {
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "send");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q.resolve(a), Q.resolve(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    var deferred = defer();
    nextTick(function () {
        resolve(object).promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
}

/**
 * Constructs a promise method that can be used to safely observe resolution of
 * a promise for an arbitrarily named method like "propfind" in a future turn.
 *
 * "dispatcher" constructs methods like "get(promise, name)" and "set(promise)".
 */
Q.dispatcher = dispatcher;
function dispatcher(op) {
    return function (object) {
        var args = array_slice(arguments, 1);
        return dispatch(object, op, args);
    };
}

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = dispatcher("get");

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = dispatcher("set");

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q["delete"] = // XXX experimental
Q.del = dispatcher("delete");

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
var post = Q.post = dispatcher("post");
Q.mapply = post; // experimental

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = send;
Q.invoke = send; // synonyms
Q.mcall = send; // experimental
function send(value, name) {
    var args = array_slice(arguments, 2);
    return post(value, name, args);
}

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = fapply;
function fapply(value, args) {
    return dispatch(value, "apply", [void 0, args]);
}

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] = fcall; // XXX experimental
Q.fcall = fcall;
function fcall(value) {
    var args = array_slice(arguments, 1);
    return fapply(value, args);
}

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = fbind;
function fbind(value) {
    var args = array_slice(arguments, 1);
    return function fbound() {
        var allArgs = args.concat(array_slice(arguments));
        return dispatch(value, "apply", [this, allArgs]);
    };
}

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = dispatcher("keys");

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(promise, function (value) {
                    promises[index] = value;
                    if (--countDown === 0) {
                        deferred.resolve(promises);
                    }
                }, deferred.reject);
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, resolve);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Q.allSettled = allSettled;
function allSettled(values) {
    return when(values, function (values) {
        return all(array_map(values, function (value, i) {
            return when(
                value,
                function (fulfillmentValue) {
                    values[i] = { state: "fulfilled", value: fulfillmentValue };
                    return values[i];
                },
                function (reason) {
                    values[i] = { state: "rejected", reason: reason };
                    return values[i];
                }
            );
        })).thenResolve(values);
    });
}

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q["catch"] = // XXX experimental
Q.fail = fail;
function fail(promise, rejected) {
    return when(promise, void 0, rejected);
}

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(promise, progressed) {
    return when(promise, void 0, void 0, progressed);
}

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q["finally"] = // XXX experimental
Q.fin = fin;
function fin(promise, callback) {
    return when(promise, function (value) {
        return when(callback(), function () {
            return value;
        });
    }, function (exception) {
        return when(callback(), function () {
            return reject(exception);
        });
    });
}

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = done;
function done(promise, fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);

            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promiseToHandle = fulfilled || rejected || progress ?
        when(promise, fulfilled, rejected, progress) :
        promise;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }
    fail(promiseToHandle, onUnhandledError);
}

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = timeout;
function timeout(promise, ms, msg) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(msg || "Timed out after " + ms + " ms"));
    }, ms);

    when(promise, function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
}

/**
 * Returns a promise for the given value (or promised value) after some
 * milliseconds.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after some
 * time has elapsed.
 */
Q.delay = delay;
function delay(promise, timeout) {
    if (timeout === void 0) {
        timeout = promise;
        promise = void 0;
    }

    var deferred = defer();

    when(promise, undefined, undefined, deferred.notify);
    setTimeout(function () {
        deferred.resolve(promise);
    }, timeout);

    return deferred.promise;
}

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = nfapply;
function nfapply(callback, args) {
    var nodeArgs = array_slice(args);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    fapply(callback, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 *
 *      Q.nfcall(FS.readFile, __filename)
 *      .then(function (content) {
 *      })
 *
 */
Q.nfcall = nfcall;
function nfcall(callback/*, ...args */) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    fapply(callback, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 *
 *      Q.nfbind(FS.readFile, __filename)("utf-8")
 *      .then(console.log)
 *      .done()
 *
 */
Q.nfbind = nfbind;
Q.denodeify = Q.nfbind; // synonyms
function nfbind(callback/*, ...args */) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());

        fapply(callback, nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
}

Q.nbind = nbind;
function nbind(callback, thisArg /*, ... args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());

        function bound() {
            return callback.apply(thisArg, arguments);
        }

        fapply(bound, nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
}

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.npost = npost;
Q.nmapply = npost; // synonyms
function npost(object, name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());

    post(object, name, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = nsend;
Q.ninvoke = Q.nsend; // synonyms
Q.nmcall = Q.nsend; // synonyms
function nsend(object, name /*, ...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    post(object, name, nodeArgs).fail(deferred.reject);
    return deferred.promise;
}

Q.nodeify = nodeify;
function nodeify(promise, nodeback) {
    if (nodeback) {
        promise.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return promise;
    }
}

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

})(require("__browserify_process"))
},{"__browserify_process":9}],3:[function(require,module,exports){
/*
 * curtain.js - the curtain containing the documentation
 */

var curtain = {},
    Zanimo = require('zanimo'),
    _$ = require('./$');

var state = false,
    $documentation,
    $activeArea,
    $star,
    $hiddenA,
    openedLenght = function () {
        return "translate3d(0, -" + (window.innerHeight - 80) + "px,0)";
    },
    hiddenLenght = function () {
        return "translate3d(0, -" + (window.innerHeight - 30) + "px,0)";
    },
    open = function (elt) {
        return Zanimo.transition(elt, "transform", openedLenght(), 400, "ease-in-out");
    },
    hide = function (elt) {
        return Zanimo.transition(elt, "transform", hiddenLenght(), 400, "ease-in-out");
    },
    close = Zanimo.transitionf("transform", "translate3d(0,0,0)", 400, "ease-in-out"),
    downStar = Zanimo.transitionf("transform", "translate3d(0,18px,0) rotate(150deg)", 200, "ease-in-out"),
    upStar = Zanimo.transitionf("transform", "translate3d(0,0,0)", 200, "ease-in-out"),
    errorLog = function (err) { new Error(err.message); },
    resize = function () {
        if(state) Zanimo($documentation).then(hide).done(empty, empty);
    },
    animate = function () {
        if(state) {
            state = false;
            return Zanimo($documentation)
                        .then(close)
                        .then(Zanimo.f($star))
                        .then(upStar, errorLog);
        }
        else {
            state = true;
            return Zanimo($documentation)
                        .then(open)
                        .then(hide)
                        .then(Zanimo.f($star))
                        .then(downStar, errorLog);
        }
    },
    activeAreaAction = function (evt) {
        evt.preventDefault();
        $hiddenA.focus();
        setTimeout(animate, 500);
    };

curtain.init = function () {
    $documentation = _$.$("article.documentation");
    $activeArea = _$.$("div.active-area");
    $star = _$.$(".chip span");
    $hiddenA = _$.$("#hidden-a");
};

curtain.bind = function () {
     if(!_$.isTouchable) window.addEventListener("resize", resize);
     window.addEventListener("orientationchange", resize);
     $activeArea.addEventListener(_$.isTouchable ? "touchstart" : "click", activeAreaAction);
};

curtain.animate = animate;
module.exports = curtain;

},{"./$":1,"zanimo":10}],5:[function(require,module,exports){
/*
 * editor.js
 */

var editor = {},
    Zanimo = require('zanimo'),
    _$ = require('./$'),
    store = require('./store'),
    runner = require('./runner');

var EMPTY_SCRIPT,
    currentScript = 0,
    lastEditorTouchTS = 0,
    _editor,
    $editor,
    $hidden,
    $select,
    $playBtn,
    $saveBtn,
    $trashBtn,
    $githubBtn,
    $shareBtn,
    $star,
    toWhite = Zanimo.transitionf("color", "#F0F1F3", 100),
    toGreen = Zanimo.transitionf("color", "green", 100),
    isMobile = /WebKit.*Mobile.*|Android/.test(navigator.userAgent),
    codeMirror = CodeMirror || {};

if (isMobile) {
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
    $githubBtn = _$.$("button.icon-github-alt", $editor);
    $shareBtn = _$.$("button.icon-share", $editor);
    $star = _$.$(".chip span");

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
    $githubBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onGithub);
    $shareBtn.addEventListener(_$.isTouchable ? "touchstart" : "click", editor.onShare);
    $select.addEventListener("change", editor.onSelect);
    window.document.addEventListener("keydown", editor.onKeydown);
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
    try {
        $hidden.focus();
        runner.run(_editor.getValue());
    } catch(err) {
        alert(err);
    }
};

editor.onShare = function (evt) {
    var url = encodeURIComponent('http://zanimo.us/#runner/' + currentScript + "/" +  window.btoa(editor.getValue())),
        text = encodeURIComponent("a zanimo.js animation: " + currentScript),
        shareUrl = 'https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Fzanimo.us&text=' + text + '&tw_p=tweetbutton&url=' + url;
    window.open(shareUrl);
};

editor.onSave = function (evt) {
    $hidden.focus();
    if(!store.save($select.value, _editor.getValue())) {
        alert("Can't overwrite example script!");
    } else {
        Zanimo($star)
            .then(toGreen)
            .then(toWhite)
            .then(toGreen)
            .then(toWhite)
            .then(toGreen)
            .then(toWhite);
    }
};

editor.onTrash = function (evt) {
    $hidden.focus();
    if (store.isDefaultExample($select.value)) {
        alert("Can't delete example script!");
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

editor.onGithub = function (evt) {
    $hidden.focus();
    if(confirm("Visit on Github?")) window.open("http://github.com/peutetre/Zanimo");
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
        alert("Can't overwrite example script!");
        setTimeout(function () {
            $select.value = currentScript;
        },10);
        return false;
    }
};

editor.onSelect = function (evt) {
    $hidden.focus();

    if(evt.target.value === "New") {
        var name = window.prompt("Script name:", "my-test"),
            trimedName = "";
        if (name && name.length > 0 && name.trim() !== "New") {
            trimedName = name.trim().replace(/ /g, '_').replace(/-/g, '_');
            editor.add(trimedName, EMPTY_SCRIPT);
        }
        else {
            if (name != null) alert("Script name is invalid!");
            setTimeout(function () {
                $select.value = currentScript;
            },30);
        }
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
        optgroupExamples = _$.DOM("optgroup"),
        optgroupUser = _$.DOM("optgroup");

    $select.innerHTML = "";
    optgroupCommands.label = "Commands";
    optgroupExamples.label = "Examples";
    optgroupUser.label = "Scripts";
    $select.appendChild(optgroupCommands);
    createOption("New", $select);
    $select.appendChild(optgroupExamples);
    exampleScripts.forEach(function (ex) {
        var op = createOption(ex, $select);
        if (ex == name) op.selected = "selected";
    });
    $select.appendChild(optgroupUser);
    userScripts.forEach(function (script) {
        var op = createOption(script, $select);
        if (script == name) op.selected = "selected";
    });
};

editor.loadExample = function (name) { _editor.setValue(store.get(name)); };

editor.getValue = function () { return _editor.getValue(); };

module.exports = editor;

},{"./$":1,"./store":4,"./runner":6,"zanimo":10}],6:[function(require,module,exports){
/*
 * runner.js - the script runner
 */

var runner = {},
    _$ = require('./$'),
    Q = require('q'),
    Zanimo = require('zanimo');

var $animScreen,
    elements,
    running = false;

runner.init = function () {
    $animScreen = _$.$("article.anim-screen");
};

runner.hideScreen = function () {
    $animScreen.style.display = "none";
};

runner.showScreen = function () {
    $animScreen.style.display = "block";
};

runner.run = function (code) {
    if (!running) {
        try {
            running = true;
            elements = [];
            var p = (new Function ("Q", "Zanimo", "create", "start", "window", "document", code)).call(
                {},
                Q,
                Zanimo,
                runner.create,
                runner.start,
                {},{}
            );
            if(Q.isPromise(p)) return p.then(runner.done, runner.fail);
            throw new Error("Runner exception, you need to return a promise!");
        } catch(err) {
            runner.done().then(function () { alert(err); });
        }
    }
};

runner.create = function (definitions) {
    var el, attr, items = [];
    definitions.forEach(function (def) {
        el = _$.DOM("div");
        el.style.width = "100px";
        el.style.height = "100px";
        el.style.position = "absolute";
        el.style.backgroundColor = "rgb(118, 189, 255)";
        el.style.zIndex = 10000;
        for(attr in def) {
            el.style[attr] = def[attr];
        }
        elements.push(el);
        items.push(el);
        document.body.appendChild(el);
    });
    return items;
};

runner.start = function (el) {
    $animScreen.style.display = "block";
    return Q.delay(200)
            .then(Zanimo.f($animScreen))
            .then(Zanimo.transitionf("opacity", 1, 200))
            .then(function () { return el; });
};

runner.clean = function () {
    elements.forEach(function (el) {
        window.document.body.removeChild(el);
    });
};

runner.done = function () {
    runner.clean();
    return Zanimo.transition($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .then(function () { return Q.delay(200).then(function () {
                    running = false;
                 })});
};

runner.fail = function (err) {
    runner.clean();
    return Zanimo.transition($animScreen, "opacity", 0, 200)
                 .then(runner.hideScreen, runner.hideScreen)
                 .then(function () { return Q.delay(200).then(function () {
                    running = false;
                 })});
};

module.exports = runner;

},{"./$":1,"q":7,"zanimo":10}],8:[function(require,module,exports){
/**
 * qstart.js - DOM ready promisified with Q
 */

(function (definition) {
    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        Qstart = definition();
    }

})(function () {
    return function () {
        var Q = window.Q || require('q'),
            d = Q.defer(),
            successƒ = function () {
                window.removeEventListener("error", errorƒ);
                d.resolve(window.document);
            },
            errorƒ = function (err) { d.reject(err); };

        window.document.addEventListener("readystatechange", function () {
            if (document.readyState == "complete") successƒ();
        }, false);
        window.addEventListener("error", errorƒ, false);
        return d.promise;
    };
});

},{"q":7}],10:[function(require,module,exports){
// Zanimo.js - Promise based CSS3 transitions
// (c) 2011-2013 Paul Panserrieu

(function (definition) {
    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        Zanimo = definition();
    }

})(function () {
    return (function () {

    var Q = window.Q || require('q');

    /**
     * Provides requestAnimationFrame in a cross browser way.
     * @author paulirish / http://paulirish.com/
     */
    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = ( function() {

            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
            function( /* function FrameRequestCallback */ callback,
                      /* DOMElement Element */ element ) {
                window.setTimeout( callback, 1000 / 60 );
            };

        } )();
    };

    /*
     * Private helper dealing with prefix and normalizing
     * css properties, transition/transform values.
     */
    var T = (function (doc) {
        var _matchParenthesis = /(\(.+?\))/g,
            _zeropixel = /^0px$/g,
            _zero = "0",
            _space = / /g,
            _normRegex = /\-([a-z])/g,
            _emptyString = "",
            _transitionend = "transitionend",
            _transition = "transition",
            _prefix = null,
            _dummy = null,
            _dummyTransition = "opacity 100ms linear 0s",
            _repr = function (v, d, t) {
                return v + " " + d + "ms " + (t || "linear");
            },
            _prefixed = { "transform": "" },
            _normReplacef = function(m, g) { return g.toUpperCase(); },
            _normCSSVal = function (match) {
                var args = match.substr(1, match.length-2).split(","), rst = [];
                args.forEach(function (arg) {
                    rst.push(arg.replace(_space, _emptyString).replace(_zeropixel, _zero));
                });
                return "(" + rst.join(",") + ")";
            },
            _norm = function (p) {
                var property = p[0] === "-" ? p.substr(1, p.length-1) : p;
                return property.replace(_normRegex, _normReplacef);
            },
            _normValue = function (val) {
                if (val === null || val === undefined) return "";
                return isNaN(val) ? val.replace(_matchParenthesis, _normCSSVal) : val.toString();
            };

            // detect transition feature
            if( 'WebkitTransition' in doc.body.style ) {
                _transitionend = 'webkitTransitionEnd';
                _prefix = "webkit";
            }

            for (var p in _prefixed)
                _prefixed[p] = _prefix ? "-" + _prefix + "-" + p : p;

            _transition = _prefix ? _prefix + "-" + _transition : _transition
            _transition = _norm(_transition);
            _dummy = doc.createElement("div");
            _dummyTransition = _normValue(_dummyTransition);
            _dummy.style[_transition] = _dummyTransition;
            _dummy = _normValue(_dummy.style[_transition]);

            if (_dummy === _dummyTransition) {
                _repr = function (v, d, t) {
                    return v + " " + d + "ms " + (t || "linear") + " 0s";
                };
            }

        return {
            // prefixed transition string
            t : _transition,
            // transform attr
            transform : _norm(_prefixed["transform"]),
            // prefixed transition end event string
            transitionend : _transitionend,
            // normalize css property
            norm : _norm,
            // prefix a css property if needed
            prefix : function (p) { return _prefixed[p] ? _prefixed[p] : p; },
            repr : _repr,
            // normalize a css transformation string like
            // "translate(340px, 0px, 230px) rotate(340deg )"
            // -> "translate(340px,0,230px) rotate(340deg)"
            normValue : _normValue
        };
    })(window.document),

    /**
     * Returns a fulfilled promise wrapping the given DOM element.
     */
    Z = function (domElt) {
        if (domElt instanceof HTMLElement) {
            return Q.resolve(domElt);
        }
        else if(Q.isPromise(domElt)) {
            return domElt.then(Z);
        }
        else {
            return Q.reject(new Error("Zanimo require an HTMLElement, or a promise of an HTMLElement"));
        }
    },

    // private helper to add a transition
    add = function (domElt, attr, value, duration, timing) {
        attr = T.prefix(attr);
        if (domElt.style[T.t]) {
            domElt.style[T.t] = domElt.style[T.t]
                                + ", "
                                + T.repr(attr, duration, timing);
        }
        else {
            domElt.style[T.t] = T.repr(attr, duration, timing);
        }
        domElt.style[T.norm(attr)] = value;
    },

    // private helper to remove a transition
    remove = function (domElt, attr, value, duration, timing) {
        var prefixedAttr = T.prefix(attr),
            keys = Object.keys(domElt._zanimo);
        if(keys.length === 1 && keys[0] === attr) domElt.style[T.t] = "";
    };

    /**
     * Starts a transition on the given DOM element and returns
     * a promise wrapping the DOM element.
     */
    Z.transition = function (domElt, attr, value, duration, timing) {
        var d = Q.defer(), timeout,
            cb = function (clear) {
                if (timeout) { clearTimeout(timeout); timeout = null; }
                remove(domElt, attr, value, duration, timing);
                domElt.removeEventListener(T.transitionend, cbTransitionend);
                if (clear) { delete domElt._zanimo[attr]; }
            },
            cbTransitionend = function (evt) {
                if(T.norm(evt.propertyName) === T.norm(T.prefix(attr))) {
                    cb(true); d.resolve(domElt);
                }
            };

        if (!(domElt instanceof HTMLElement)) {
            d.reject(new Error("Zanimo transition: no DOM element!"));
            return d.promise;
        }
        if(window.isNaN(parseInt(duration, 10))) {
            d.reject(new Error("Zanimo transition: duration must be an integer!"));
            return d.promise;
        }

        domElt.addEventListener(T.transitionend, cbTransitionend);

        window.requestAnimationFrame(function () {
            add(domElt, attr, value, duration, timing);
            timeout = setTimeout(function () {
                var rawVal = domElt.style.getPropertyValue(T.prefix(attr)),
                    domVal = T.normValue(rawVal),
                    givenVal = T.normValue(value);

                cb(true);
                if (domVal === givenVal) { d.resolve(domElt); }
                else {
                    d.reject( new Error("Zanimo transition: "
                        + domElt.id + " with " + attr + " = " + givenVal
                        + ", DOM value=" + domVal
                    ));
                }
            }, duration + 20 );

            domElt._zanimo = domElt._zanimo || { };
            if(domElt._zanimo[attr]) {
                domElt._zanimo[attr].defer.reject(new Error("Zanimo transition "
                    + domElt.id + " with "
                    + attr + "=" + domElt._zanimo[attr].value
                    + " stopped by transition with " + attr + "=" + value
                ));
                domElt._zanimo[attr].cb();
            }
            domElt._zanimo[attr] = {cb: cb, value: value, defer: d};

        }, domElt);

        return d.promise;
    };

    /**
     * A function wrapping Zanimo.transition().
     */
    Z.transitionf = function (attr, value, duration, timing) {
        return function (elt) {
            return Z.transition(elt, attr, value, duration, timing);
        };
    };

    /**
     * Apply a CSS3 transform value to a given DOM element
     * and returns a promise wrapping the DOM element.
     */
    Z.transform = function (elt, value, overwrite) {
        var d = Q.defer();

        if (!(elt instanceof HTMLElement)) {
            d.reject(new Error("Zanimo transform: no DOM element!"));
            return d.promise;
        }

        if(elt._zanimo && elt._zanimo.hasOwnProperty("transform")) {
            elt._zanimo["transform"].defer.reject(new Error(
                "Zanimo transition " + elt.id + " with transform="
                + elt._zanimo["transform"].value
                + " stopped by transform=" + value
            ));
            elt._zanimo["transform"].cb();
        }

        window.requestAnimationFrame(function () {
            elt.style[T.transform] =
                !overwrite ? elt.style[T.transform] + " " + value : value;
            d.resolve(elt);
        }, elt);
        return d.promise;
    };

    /**
     * A function wrapping Zanimo.transform().
     */
    Z.transformf = function (value, overwrite) {
        return function (elt) {
            return Z.transform(elt, value, overwrite);
        };
    };

    /**
     * A function wrapping Zanimo().
     */
    Z.f = function (elt) {
        return function () {
            return Z(elt);
        };
    };

    /**
     * Needed to run parallel Zanimo animations.
     */
    Z.all = function (flist) {
        return function (el) {
            return Q.allResolved(flist.map(function (f) { return f(el); }))
                    .then(function (plist) {
                        var rejected = plist.filter(function (p) { return Q.isRejected(p); });
                        if(rejected.length) return Q.reject(rejected);
                        else return el;
                    });
        }
    };

    Z._T = T;

    return Z;
})();

});

},{"q":7}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvcGV1dGV0cmUvY29kZS96YW5pbW8tZWRpdG9yL2xpYi8kLmpzIiwiL1VzZXJzL3BldXRldHJlL2NvZGUvemFuaW1vLWVkaXRvci9saWIvYXBwLmpzIiwiL1VzZXJzL3BldXRldHJlL2NvZGUvemFuaW1vLWVkaXRvci9saWIvc3RvcmUuanMiLCIvVXNlcnMvcGV1dGV0cmUvY29kZS96YW5pbW8tZWRpdG9yL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9wZXV0ZXRyZS9jb2RlL3phbmltby1lZGl0b3Ivbm9kZV9tb2R1bGVzL3EvcS5qcyIsIi9Vc2Vycy9wZXV0ZXRyZS9jb2RlL3phbmltby1lZGl0b3IvbGliL2N1cnRhaW4uanMiLCIvVXNlcnMvcGV1dGV0cmUvY29kZS96YW5pbW8tZWRpdG9yL2xpYi9lZGl0b3IuanMiLCIvVXNlcnMvcGV1dGV0cmUvY29kZS96YW5pbW8tZWRpdG9yL2xpYi9ydW5uZXIuanMiLCIvVXNlcnMvcGV1dGV0cmUvY29kZS96YW5pbW8tZWRpdG9yL25vZGVfbW9kdWxlcy9xc3RhcnQvc3JjL3FzdGFydC5qcyIsIi9Vc2Vycy9wZXV0ZXRyZS9jb2RlL3phbmltby1lZGl0b3Ivbm9kZV9tb2R1bGVzL3phbmltby9kaXN0L3phbmltby0wLjAuNy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiAkLmpzIC0gdXRpbHNcbiAqL1xuXG5leHBvcnRzLiQgPSBmdW5jdGlvbiAkKHMsIGMpIHsgcmV0dXJuIChjIHx8IHdpbmRvdy5kb2N1bWVudCkucXVlcnlTZWxlY3RvcihzKTsgfVxuZXhwb3J0cy4kJCA9IGZ1bmN0aW9uICQkKHMsIGMpIHsgcmV0dXJuIChjIHx8IHdpbmRvdy5kb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzKTsgfVxuZXhwb3J0cy5ET00gPSBmdW5jdGlvbiBET00odGFnKSB7IHJldHVybiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyB9XG5leHBvcnRzLmVtcHR5ID0gZnVuY3Rpb24gZW1wdHkoKSB7IH1cbmV4cG9ydHMuaXNUb3VjaGFibGUgPSB3aW5kb3cuZG9jdW1lbnQub250b3VjaHN0YXJ0ID09PSBudWxsO1xuIiwiLypcbiAqIGFwcC5qcyAtIHRoZSBaYW5pbW8gYW5pbWF0aW9uIGVkaXRvclxuICovXG5cbnZhciBhcHAgPSB7fSxcbiAgICBWRVJTSU9OID0gMjUsXG4gICAgUSA9IHJlcXVpcmUoJ3EnKSxcbiAgICBxc3RhcnQgPSByZXF1aXJlKCdxc3RhcnQnKSxcbiAgICBfJCA9IHJlcXVpcmUoJy4vJCcpLFxuICAgIGN1cnRhaW4gPSByZXF1aXJlKCcuL2N1cnRhaW4nKSxcbiAgICBzdG9yZSA9IHJlcXVpcmUoJy4vc3RvcmUnKSxcbiAgICBlZGl0b3IgPSByZXF1aXJlKCcuL2VkaXRvcicpLFxuICAgIHJ1bm5lciA9IHJlcXVpcmUoJy4vcnVubmVyJyk7XG5cbi8vIGZpeCBsYXlvdXQgd2hlbiBubyBDU1MgY2FsYygpIHN1cHBvcnQgYXZhaWxhYmxlXG5mdW5jdGlvbiBmaXhDU1NDYWxjKCkge1xuICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgIGNhbGMgPSBudWxsO1xuXG4gICAgW1wiXCIsIFwiLXdlYmtpdC1cIiwgXCItbW96LVwiLCBcIi1tcy1cIl0uZm9yRWFjaChmdW5jdGlvbiAocHJlZml4KSB7XG4gICAgICAgIHZhciB0ID0gcHJlZml4ICsgXCJjYWxjKDEwcHgpXCI7XG4gICAgICAgIGR1bW15LnN0eWxlLmNzc1RleHQgPSBcIndpZHRoOlwiICsgdCArIFwiO1wiO1xuICAgICAgICBpZihkdW1teS5zdHlsZS53aWR0aCA9PT0gdCkgY2FsYyA9IHByZWZpeCArIFwiY2FsY1wiO1xuICAgIH0pO1xuXG4gICAgaWYgKGNhbGMgIT09IG51bGwpIHJldHVybjtcblxuICAgIHZhciAkZG9jID0gXyQuJChcIi5kb2N1bWVudGF0aW9uIHNlY3Rpb24uY29udGVudFwiKSxcbiAgICAgICAgJGNvbnRlbnQgPSBfJC4kKFwiLmRvY3VtZW50YXRpb24gc2VjdGlvbi5jb250ZW50IGRpdi5kb2MtY29udGVudFwiKSxcbiAgICAgICAgJGVkaXRvciA9IF8kLiQoXCIuQ29kZU1pcnJvclwiKSxcbiAgICAgICAgZml4TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgICAgICAkZG9jLnN0eWxlLmhlaWdodCA9IChoIC0gMzApICsgXCJweFwiO1xuICAgICAgICAgICAgJGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gKGggLSA2NSkgKyBcInB4XCI7XG4gICAgICAgICAgICBpZigkZWRpdG9yKSAkZWRpdG9yLnN0eWxlLmhlaWdodCA9IChoIC0gODApICsgXCJweFwiO1xuICAgICAgICB9O1xuICAgIGlmKCFfJC5pc1RvdWNoYWJsZSkgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZml4TGF5b3V0KTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm9yaWVudGF0aW9uY2hhbmdlXCIsIGZpeExheW91dCk7XG4gICAgZml4TGF5b3V0KCk7XG59XG5cbmFwcC5zaGFyZSA9IGZ1bmN0aW9uICgpIHsgZWRpdG9yLm9uU2hhcmUoKTsgfTtcblxuYXBwLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgvIy8sICcnKSxcbiAgICAgICAgbWF0Y2hSb3V0ZSA9IGhhc2gubWF0Y2goLyhydW5uZXIpXFwvKFxcdyspXFwvKFxcdyspLyk7XG5cbiAgICBzd2l0Y2ggKCBtYXRjaFJvdXRlID8gbWF0Y2hSb3V0ZVsxXSA6IFwiXCIgKSB7XG4gICAgICAgIGNhc2UgXCJydW5uZXJcIjpcbiAgICAgICAgICAgIGlmIChlZGl0b3IuYWRkKG1hdGNoUm91dGVbMl0sIHdpbmRvdy5hdG9iKG1hdGNoUm91dGVbM10pKSlcbiAgICAgICAgICAgICAgICBydW5uZXIucnVuKGVkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gXCJcIjtcbiAgICAgICAgICAgIFEud2hlbihRLmRlbGF5KDEwMDApLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY3VydGFpbi5hbmltYXRlKCkudGhlbihjdXJ0YWluLmJpbmQpXG4gICAgICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5hcHAuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjdXJ0YWluLmluaXQoKTtcbiAgICBzdG9yZS5zZXR1cChWRVJTSU9OKTtcbiAgICBydW5uZXIuaW5pdCgpO1xuICAgIGVkaXRvci5pbml0KCk7XG4gICAgZml4Q1NTQ2FsYygpO1xuICAgIGFwcC5zaG93KCk7XG59O1xuXG5xc3RhcnQoKS50aGVuKGFwcC5pbml0KTtcbiIsIi8qXG4gKiBzdG9yZS5qcyAtIHRoZSBjb2RlIHN0b3JlXG4gKi9cbnZhciBzdG9yZSA9IHt9LFxuICAgIF8kID0gcmVxdWlyZSgnLi8kJyk7XG5cbnZhciBzdG9yYWdlS2V5ID0gXCJ6YW5pbW8tZXhhbXBsZXNcIixcbiAgICBkZWZhdWx0RXhhbXBsZXMgPSBbXSxcbiAgICBzdG9yYWdlID0gd2luZG93LmxvY2FsU3RvcmFnZSxcbiAgICBsb2FkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gSlNPTi5wYXJzZShzdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSkpOyB9LFxuICAgIGhhc0tleSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0b3JhZ2UuaGFzT3duUHJvcGVydHkoc3RvcmFnZUtleSk7IH07XG5cbnN0b3JlLnNldHVwID0gZnVuY3Rpb24gKHZlcnNpb24pIHtcbiAgICB2YXIgc2NyaXB0cyA9IF8kLiQkKFwic2NyaXB0W2RhdGEtZXhhbXBsZS1pZF1cIiksIGRhdGEgPSB7fSwgb3V0cHV0ID0ge30sXG4gICAgICAgIGwgPSBzY3JpcHRzLmxlbmd0aCwgbmFtZSA9IG51bGwsIHNjcmlwdCA9IG51bGwsIGkgPSAwO1xuXG4gICAgZm9yIChpOyBpPGw7IGkrKykge1xuICAgICAgICBzY3JpcHQgPSBzY3JpcHRzLml0ZW0oaSk7XG4gICAgICAgIG5hbWUgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1leGFtcGxlLWlkXCIpO1xuICAgICAgICBkYXRhW25hbWVdID0gc2NyaXB0LmlubmVySFRNTDtcbiAgICAgICAgZGVmYXVsdEV4YW1wbGVzLnB1c2gobmFtZSk7XG4gICAgfVxuXG4gICAgaWYoaGFzS2V5KCkgJiYgcGFyc2VJbnQoc3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkrXCJWRVJTSU9OXCIpLCAxMCkgPT09IHZlcnNpb24pIHJldHVybjtcbiAgICBpZiAoaGFzS2V5KCkpIHtcbiAgICAgICAgb3V0cHV0ID0gSlNPTi5wYXJzZShzdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSkpO1xuICAgICAgICBmb3IodmFyIGQgaW4gZGF0YSlcbiAgICAgICAgICAgIG91dHB1dFtkXSA9IGRhdGFbZF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBvdXRwdXQgPSBkYXRhO1xuICAgIH1cbiAgICBzdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkob3V0cHV0KSk7XG4gICAgc3RvcmFnZS5zZXRJdGVtKHN0b3JhZ2VLZXkrXCJWRVJTSU9OXCIsIHZlcnNpb24pO1xufTtcblxuc3RvcmUuaXNEZWZhdWx0RXhhbXBsZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRFeGFtcGxlcy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbn07XG5cbnN0b3JlLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYoIWhhc0tleSgpKSByZXR1cm47XG4gICAgdmFyIGRhdGEgPSBsb2FkKCk7XG4gICAgcmV0dXJuIGRhdGFbbmFtZV0gfHwgXCJcIjtcbn07XG5cbnN0b3JlLmdldExpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIWhhc0tleSgpKSByZXR1cm4gW107XG4gICAgdmFyIGRhdGEgPSBsb2FkKCksXG4gICAgICAgIGtleXMgPSBbXSwga2V5O1xuICAgIGZvcihrZXkgaW4gZGF0YSkgeyBrZXlzLnB1c2goa2V5KTsgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxuc3RvcmUuc2F2ZSA9IGZ1bmN0aW9uIChuYW1lLCBjb2RlKSB7XG4gICAgaWYgKHN0b3JlLmlzRGVmYXVsdEV4YW1wbGUobmFtZSkpIHJldHVybiBmYWxzZTtcbiAgICB2YXIgZGF0YSA9IGxvYWQoKTtcbiAgICBkYXRhW25hbWVdID0gY29kZTtcbiAgICBzdG9yYWdlLnNldEl0ZW0oc3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuc3RvcmUudHJhc2ggPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBkYXRhID0gbG9hZCgpO1xuICAgIGRlbGV0ZSBkYXRhW25hbWVdO1xuICAgIHN0b3JhZ2Uuc2V0SXRlbShzdG9yYWdlS2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59O1xuXG5zdG9yZS5oZWFkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzdG9yZS5nZXRMaXN0KClbMF07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7Ly8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICAvLyBUdXJuIG9mZiBzdHJpY3QgbW9kZSBmb3IgdGhpcyBmdW5jdGlvbiBzbyB3ZSBjYW4gYXNzaWduIHRvIGdsb2JhbC5RXG4gICAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIHtcbiAgICAgICAgUSA9IGRlZmluaXRpb24oKTtcbiAgICB9XG5cbn0pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzU3RhY2tzID0gZmFsc2U7XG50cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xufSBjYXRjaCAoZSkge1xuICAgIGhhc1N0YWNrcyA9ICEhZS5zdGFjaztcbn1cblxuLy8gQWxsIGNvZGUgYWZ0ZXIgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzIHJlcG9ydGVkXG4vLyBieSBRLlxudmFyIHFTdGFydGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xudmFyIHFGaWxlTmFtZTtcblxuLy8gc2hpbXNcblxuLy8gdXNlZCBmb3IgZmFsbGJhY2sgaW4gXCJhbGxSZXNvbHZlZFwiXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG52YXIgbmV4dFRpY2sgPShmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG4gICAgdmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbiAgICB2YXIgdGFpbCA9IGhlYWQ7XG4gICAgdmFyIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgdmFyIHJlcXVlc3RUaWNrID0gdm9pZCAwO1xuICAgIHZhciBpc05vZGVKUyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgICAgICB2YXIgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgZG9tYWluICYmIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgICAgICBkb21haW4gJiYgZG9tYWluLmVudGVyKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09IFwidW5kZWZpbmVkXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBOb2RlLmpzIGJlZm9yZSAwLjkuIE5vdGUgdGhhdCBzb21lIGZha2UtTm9kZSBlbnZpcm9ubWVudHMsIGxpa2UgdGhlXG4gICAgICAgIC8vIE1vY2hhIHRlc3QgcnVubmVyLCBpbnRyb2R1Y2UgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgZG9lcyBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplXG4vLyBvZiB0aGUgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpLCBlbGltaW5hdGluZyBtYW55XG4vLyBoYXJkLXRvLW1pbmlmeSBjaGFyYWN0ZXJzLlxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4vLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbi8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbi8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuLy8gdGhpcyBibG9jay5cbnZhciBoYXNFUzZHZW5lcmF0b3JzO1xudHJ5IHtcbiAgICAvKiBqc2hpbnQgZXZpbDogdHJ1ZSwgbm9uZXc6IGZhbHNlICovXG4gICAgbmV3IEZ1bmN0aW9uKFwiKGZ1bmN0aW9uKiAoKXsgeWllbGQgMTsgfSlcIik7XG4gICAgaGFzRVM2R2VuZXJhdG9ycyA9IHRydWU7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzRVM2R2VuZXJhdG9ycyA9IGZhbHNlO1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENyZWF0ZXMgZnVsZmlsbGVkIHByb21pc2VzIGZyb20gbm9uLXRoZW5hYmxlcyxcbiAqIFBhc3NlcyBRIHByb21pc2VzIHRocm91Z2gsXG4gKiBDb2VyY2VzIG90aGVyIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmUodmFsdWUpO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZGVwcmVjYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH0sIFwidmFsdWVPZlwiLCBcImluc3BlY3RcIik7XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZXNvbHZlKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIGZjYWxsKFxuICAgICAgICByZXNvbHZlcixcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSxcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICBkZWZlcnJlZC5ub3RpZnlcbiAgICApLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGRlcHJlY2F0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBkb25lID0gZmFsc2U7ICAgLy8gZW5zdXJlIHRoZSB1bnRydXN0ZWQgcHJvbWlzZSBtYWtlcyBhdCBtb3N0IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBjYWxsIHRvIG9uZSBvZiB0aGUgY2FsbGJhY2tzXG5cbiAgICBmdW5jdGlvbiBfZnVsZmlsbGVkKHZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiID8gZnVsZmlsbGVkKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWplY3RlZChleGNlcHRpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXhjZXB0aW9uLCBzZWxmKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkKGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChuZXdFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ld0V4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wcm9ncmVzc2VkKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvZ3Jlc3NlZCA9PT0gXCJmdW5jdGlvblwiID8gcHJvZ3Jlc3NlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB3aGVuKHRoaXMsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIHdoZW4odGhpcywgZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuLy8gQ2hhaW5hYmxlIG1ldGhvZHNcbmFycmF5X3JlZHVjZShcbiAgICBbXG4gICAgICAgIFwiaXNGdWxmaWxsZWRcIiwgXCJpc1JlamVjdGVkXCIsIFwiaXNQZW5kaW5nXCIsXG4gICAgICAgIFwiZGlzcGF0Y2hcIixcbiAgICAgICAgXCJ3aGVuXCIsIFwic3ByZWFkXCIsXG4gICAgICAgIFwiZ2V0XCIsIFwic2V0XCIsIFwiZGVsXCIsIFwiZGVsZXRlXCIsXG4gICAgICAgIFwicG9zdFwiLCBcInNlbmRcIiwgXCJtYXBwbHlcIiwgXCJpbnZva2VcIiwgXCJtY2FsbFwiLFxuICAgICAgICBcImtleXNcIixcbiAgICAgICAgXCJmYXBwbHlcIiwgXCJmY2FsbFwiLCBcImZiaW5kXCIsXG4gICAgICAgIFwiYWxsXCIsIFwiYWxsUmVzb2x2ZWRcIixcbiAgICAgICAgXCJ0aW1lb3V0XCIsIFwiZGVsYXlcIixcbiAgICAgICAgXCJjYXRjaFwiLCBcImZpbmFsbHlcIiwgXCJmYWlsXCIsIFwiZmluXCIsIFwicHJvZ3Jlc3NcIiwgXCJkb25lXCIsXG4gICAgICAgIFwibmZjYWxsXCIsIFwibmZhcHBseVwiLCBcIm5mYmluZFwiLCBcImRlbm9kZWlmeVwiLCBcIm5iaW5kXCIsXG4gICAgICAgIFwibnBvc3RcIiwgXCJuc2VuZFwiLCBcIm5tYXBwbHlcIiwgXCJuaW52b2tlXCIsIFwibm1jYWxsXCIsXG4gICAgICAgIFwibm9kZWlmeVwiXG4gICAgXSxcbiAgICBmdW5jdGlvbiAodW5kZWZpbmVkLCBuYW1lKSB7XG4gICAgICAgIFByb21pc2UucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFFbbmFtZV0uYXBwbHkoXG4gICAgICAgICAgICAgICAgUSxcbiAgICAgICAgICAgICAgICBbdGhpc10uY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgdm9pZCAwXG4pO1xuXG5Qcm9taXNlLnByb3RvdHlwZS50b1NvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuLyoqXG4gKiBJZiBhbiBvYmplY3QgaXMgbm90IGEgcHJvbWlzZSwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUuXG4gKiBJZiBhIHByb21pc2UgaXMgcmVqZWN0ZWQsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlIHRvby5cbiAqIElmIGl04oCZcyBhIGZ1bGZpbGxlZCBwcm9taXNlLCB0aGUgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmVhcmVyLlxuICogSWYgaXTigJlzIGEgZGVmZXJyZWQgcHJvbWlzZSBhbmQgdGhlIGRlZmVycmVkIGhhcyBiZWVuIHJlc29sdmVkLCB0aGVcbiAqIHJlc29sdXRpb24gaXMgXCJuZWFyZXJcIi5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIG1vc3QgcmVzb2x2ZWQgKG5lYXJlc3QpIGZvcm0gb2YgdGhlIG9iamVjdFxuICovXG5cbi8vIFhYWCBzaG91bGQgd2UgcmUtZG8gdGhpcz9cblEubmVhcmVyID0gbmVhcmVyO1xuZnVuY3Rpb24gbmVhcmVyKHZhbHVlKSB7XG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IHZhbHVlLmluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcHJvbWlzZS5cbiAqIE90aGVyd2lzZSBpdCBpcyBhIGZ1bGZpbGxlZCB2YWx1ZS5cbiAqL1xuUS5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiZcbiAgICAgICAgdHlwZW9mIG9iamVjdC5wcm9taXNlRGlzcGF0Y2ggPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICB0eXBlb2Ygb2JqZWN0Lmluc3BlY3QgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgdmFsdWUgb3IgZnVsZmlsbGVkXG4gKiBwcm9taXNlLlxuICovXG5RLmlzRnVsZmlsbGVkID0gaXNGdWxmaWxsZWQ7XG5mdW5jdGlvbiBpc0Z1bGZpbGxlZChvYmplY3QpIHtcbiAgICByZXR1cm4gIWlzUHJvbWlzZShvYmplY3QpIHx8IG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqL1xuUS5pc1JlamVjdGVkID0gaXNSZWplY3RlZDtcbmZ1bmN0aW9uIGlzUmVqZWN0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn1cblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB1bmhhbmRsZWRSZWFzb25zRGlzcGxheWVkID0gZmFsc2U7XG52YXIgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcbmZ1bmN0aW9uIGRpc3BsYXlVbmhhbmRsZWRSZWFzb25zKCkge1xuICAgIGlmIChcbiAgICAgICAgIXVuaGFuZGxlZFJlYXNvbnNEaXNwbGF5ZWQgJiZcbiAgICAgICAgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAhd2luZG93LlRvdWNoICYmXG4gICAgICAgIHdpbmRvdy5jb25zb2xlXG4gICAgKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltRXSBVbmhhbmRsZWQgcmVqZWN0aW9uIHJlYXNvbnMgKHNob3VsZCBiZSBlbXB0eSk6XCIsXG4gICAgICAgICAgICAgICAgICAgICB1bmhhbmRsZWRSZWFzb25zKTtcbiAgICB9XG5cbiAgICB1bmhhbmRsZWRSZWFzb25zRGlzcGxheWVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gbG9nVW5oYW5kbGVkUmVhc29ucygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVuaGFuZGxlZFJlYXNvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJlYXNvbiA9IHVuaGFuZGxlZFJlYXNvbnNbaV07XG4gICAgICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiVW5oYW5kbGVkIHJlamVjdGlvbiByZWFzb246XCIsIHJlYXNvbi5zdGFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJVbmhhbmRsZWQgcmVqZWN0aW9uIHJlYXNvbiAobm8gc3RhY2spOlwiLCByZWFzb24pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcbiAgICB1bmhhbmRsZWRSZWFzb25zRGlzcGxheWVkID0gZmFsc2U7XG5cbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG4gICAgICAgIC8vIFNob3cgdW5oYW5kbGVkIHJlamVjdGlvbiByZWFzb25zIGlmIE5vZGUgZXhpdHMgd2l0aG91dCBoYW5kbGluZyBhblxuICAgICAgICAvLyBvdXRzdGFuZGluZyByZWplY3Rpb24uICAoTm90ZSB0aGF0IEJyb3dzZXJpZnkgcHJlc2VudGx5IHByb2R1Y2VzIGFcbiAgICAgICAgLy8gYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IHRoZSBgRXZlbnRFbWl0dGVyYCBgb25gIG1ldGhvZC4pXG4gICAgICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm9uKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCBsb2dVbmhhbmRsZWRSZWFzb25zKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJhY2tSZWplY3Rpb24ocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uKTtcbiAgICBkaXNwbGF5VW5oYW5kbGVkUmVhc29ucygpO1xufVxuXG5mdW5jdGlvbiB1bnRyYWNrUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGF0ID0gYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICBpZiAoYXQgIT09IC0xKSB7XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLm9uKSB7XG4gICAgICAgIHByb2Nlc3MucmVtb3ZlTGlzdGVuZXIoXCJleGl0XCIsIGxvZ1VuaGFuZGxlZFJlYXNvbnMpO1xuICAgIH1cbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc1AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzUCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5RLnJlc29sdmUgPSByZXNvbHZlO1xuZnVuY3Rpb24gcmVzb2x2ZSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQocHJvbWlzZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB3aGVuKHByb21pc2UsIGZ1bmN0aW9uICh2YWx1ZXNPclByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwodmFsdWVzT3JQcm9taXNlcykudGhlbihmdW5jdGlvbiAodmFsdWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgdmFsdWVzKTtcbiAgICAgICAgfSwgcmVqZWN0ZWQpO1xuICAgIH0sIHJlamVjdGVkKTtcbn1cblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIGlmIChoYXNFUzZHZW5lcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4Y2VwdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwic2VuZFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEucmVzb2x2ZShhKSwgUS5yZXNvbHZlKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlc29sdmUob2JqZWN0KS5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIG1ldGhvZCB0aGF0IGNhbiBiZSB1c2VkIHRvIHNhZmVseSBvYnNlcnZlIHJlc29sdXRpb24gb2ZcbiAqIGEgcHJvbWlzZSBmb3IgYW4gYXJiaXRyYXJpbHkgbmFtZWQgbWV0aG9kIGxpa2UgXCJwcm9wZmluZFwiIGluIGEgZnV0dXJlIHR1cm4uXG4gKlxuICogXCJkaXNwYXRjaGVyXCIgY29uc3RydWN0cyBtZXRob2RzIGxpa2UgXCJnZXQocHJvbWlzZSwgbmFtZSlcIiBhbmQgXCJzZXQocHJvbWlzZSlcIi5cbiAqL1xuUS5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcbmZ1bmN0aW9uIGRpc3BhdGNoZXIob3ApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGRpc3BhdGNoZXIoXCJnZXRcIik7XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBkaXNwYXRjaGVyKFwic2V0XCIpO1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RW1wiZGVsZXRlXCJdID0gLy8gWFhYIGV4cGVyaW1lbnRhbFxuUS5kZWwgPSBkaXNwYXRjaGVyKFwiZGVsZXRlXCIpO1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcbnZhciBwb3N0ID0gUS5wb3N0ID0gZGlzcGF0Y2hlcihcInBvc3RcIik7XG5RLm1hcHBseSA9IHBvc3Q7IC8vIGV4cGVyaW1lbnRhbFxuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IHNlbmQ7XG5RLmludm9rZSA9IHNlbmQ7IC8vIHN5bm9ueW1zXG5RLm1jYWxsID0gc2VuZDsgLy8gZXhwZXJpbWVudGFsXG5mdW5jdGlvbiBzZW5kKHZhbHVlLCBuYW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBwb3N0KHZhbHVlLCBuYW1lLCBhcmdzKTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmYXBwbHk7XG5mdW5jdGlvbiBmYXBwbHkodmFsdWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gZGlzcGF0Y2godmFsdWUsIFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufVxuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9IGZjYWxsOyAvLyBYWFggZXhwZXJpbWVudGFsXG5RLmZjYWxsID0gZmNhbGw7XG5mdW5jdGlvbiBmY2FsbCh2YWx1ZSkge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZmFwcGx5KHZhbHVlLCBhcmdzKTtcbn1cblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmYmluZDtcbmZ1bmN0aW9uIGZiaW5kKHZhbHVlKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHZhciBhbGxBcmdzID0gYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh2YWx1ZSwgXCJhcHBseVwiLCBbdGhpcywgYWxsQXJnc10pO1xuICAgIH07XG59XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZGlzcGF0Y2hlcihcImtleXNcIik7XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgY291bnREb3duID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrY291bnREb3duO1xuICAgICAgICAgICAgICAgIHdoZW4ocHJvbWlzZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoLS1jb3VudERvd24gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKGNvdW50RG93biA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCByZXNvbHZlKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblEuYWxsU2V0dGxlZCA9IGFsbFNldHRsZWQ7XG5mdW5jdGlvbiBhbGxTZXR0bGVkKHZhbHVlcykge1xuICAgIHJldHVybiB3aGVuKHZhbHVlcywgZnVuY3Rpb24gKHZhbHVlcykge1xuICAgICAgICByZXR1cm4gYWxsKGFycmF5X21hcCh2YWx1ZXMsIGZ1bmN0aW9uICh2YWx1ZSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHdoZW4oXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGZ1bGZpbGxtZW50VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2ldID0geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IGZ1bGZpbGxtZW50VmFsdWUgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2ldID0geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pKS50aGVuUmVzb2x2ZSh2YWx1ZXMpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENhcHR1cmVzIHRoZSBmYWlsdXJlIG9mIGEgcHJvbWlzZSwgZ2l2aW5nIGFuIG9wb3J0dW5pdHkgdG8gcmVjb3ZlclxuICogd2l0aCBhIGNhbGxiYWNrLiAgSWYgdGhlIGdpdmVuIHByb21pc2UgaXMgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAqIHByb21pc2UgaXMgZnVsZmlsbGVkLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGZ1bGZpbGwgdGhlIHJldHVybmVkIHByb21pc2UgaWYgdGhlXG4gKiBnaXZlbiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGNhbGxiYWNrXG4gKi9cblFbXCJjYXRjaFwiXSA9IC8vIFhYWCBleHBlcmltZW50YWxcblEuZmFpbCA9IGZhaWw7XG5mdW5jdGlvbiBmYWlsKHByb21pc2UsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgdm9pZCAwLCByZWplY3RlZCk7XG59XG5cbi8qKlxuICogQXR0YWNoZXMgYSBsaXN0ZW5lciB0aGF0IGNhbiByZXNwb25kIHRvIHByb2dyZXNzIG5vdGlmaWNhdGlvbnMgZnJvbSBhXG4gKiBwcm9taXNlJ3Mgb3JpZ2luYXRpbmcgZGVmZXJyZWQuIFRoaXMgbGlzdGVuZXIgcmVjZWl2ZXMgdGhlIGV4YWN0IGFyZ3VtZW50c1xuICogcGFzc2VkIHRvIGBgZGVmZXJyZWQubm90aWZ5YGAuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gcmVjZWl2ZSBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybnMgdGhlIGdpdmVuIHByb21pc2UsIHVuY2hhbmdlZFxuICovXG5RLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5mdW5jdGlvbiBwcm9ncmVzcyhwcm9taXNlLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgdm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIG9ic2VydmUgdGhlIHNldHRsaW5nIG9mIGEgcHJvbWlzZSxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBGb3J3YXJkc1xuICogdGhlIHJlc29sdXRpb24gdG8gdGhlIHJldHVybmVkIHByb21pc2Ugd2hlbiB0aGUgY2FsbGJhY2sgaXMgZG9uZS5cbiAqIFRoZSBjYWxsYmFjayBjYW4gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBjb21wbGV0aW9uLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBvYnNlcnZlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlblxuICogcHJvbWlzZSwgdGFrZXMgbm8gYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSB3aGVuXG4gKiBgYGZpbmBgIGlzIGRvbmUuXG4gKi9cblFbXCJmaW5hbGx5XCJdID0gLy8gWFhYIGV4cGVyaW1lbnRhbFxuUS5maW4gPSBmaW47XG5mdW5jdGlvbiBmaW4ocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHdoZW4oY2FsbGJhY2soKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIHJldHVybiB3aGVuKGNhbGxiYWNrKCksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogVGVybWluYXRlcyBhIGNoYWluIG9mIHByb21pc2VzLCBmb3JjaW5nIHJlamVjdGlvbnMgdG8gYmVcbiAqIHRocm93biBhcyBleGNlcHRpb25zLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGF0IHRoZSBlbmQgb2YgYSBjaGFpbiBvZiBwcm9taXNlc1xuICogQHJldHVybnMgbm90aGluZ1xuICovXG5RLmRvbmUgPSBkb25lO1xuZnVuY3Rpb24gZG9uZShwcm9taXNlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHZhciBvblVuaGFuZGxlZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIGZvcndhcmQgdG8gYSBmdXR1cmUgdHVybiBzbyB0aGF0IGBgd2hlbmBgXG4gICAgICAgIC8vIGRvZXMgbm90IGNhdGNoIGl0IGFuZCB0dXJuIGl0IGludG8gYSByZWplY3Rpb24uXG4gICAgICAgIG5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG5cbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHVubmVjZXNzYXJ5IGBuZXh0VGlja2BpbmcgdmlhIGFuIHVubmVjZXNzYXJ5IGB3aGVuYC5cbiAgICB2YXIgcHJvbWlzZVRvSGFuZGxlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgd2hlbihwcm9taXNlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykgOlxuICAgICAgICBwcm9taXNlO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5kb21haW4pIHtcbiAgICAgICAgb25VbmhhbmRsZWRFcnJvciA9IHByb2Nlc3MuZG9tYWluLmJpbmQob25VbmhhbmRsZWRFcnJvcik7XG4gICAgfVxuICAgIGZhaWwocHJvbWlzZVRvSGFuZGxlLCBvblVuaGFuZGxlZEVycm9yKTtcbn1cblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge1N0cmluZ30gY3VzdG9tIGVycm9yIG1lc3NhZ2UgKG9wdGlvbmFsKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpZiBpdCBpc1xuICogZnVsZmlsbGVkIGJlZm9yZSB0aGUgdGltZW91dCwgb3RoZXJ3aXNlIHJlamVjdGVkLlxuICovXG5RLnRpbWVvdXQgPSB0aW1lb3V0O1xuZnVuY3Rpb24gdGltZW91dChwcm9taXNlLCBtcywgbXNnKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IobXNnIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKSk7XG4gICAgfSwgbXMpO1xuXG4gICAgd2hlbihwcm9taXNlLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgIH0sIGRlZmVycmVkLm5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSkgYWZ0ZXIgc29tZVxuICogbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGFmdGVyIHNvbWVcbiAqIHRpbWUgaGFzIGVsYXBzZWQuXG4gKi9cblEuZGVsYXkgPSBkZWxheTtcbmZ1bmN0aW9uIGRlbGF5KHByb21pc2UsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBwcm9taXNlO1xuICAgICAgICBwcm9taXNlID0gdm9pZCAwO1xuICAgIH1cblxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG5cbiAgICB3aGVuKHByb21pc2UsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2UpO1xuICAgIH0sIHRpbWVvdXQpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgYXMgYW4gYXJyYXksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZhcHBseShGUy5yZWFkRmlsZSwgW19fZmlsZW5hbWVdKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmFwcGx5ID0gbmZhcHBseTtcbmZ1bmN0aW9uIG5mYXBwbHkoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcblxuICAgIGZhcHBseShjYWxsYmFjaywgbm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBpbmRpdmlkdWFsbHksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmNhbGwgPSBuZmNhbGw7XG5mdW5jdGlvbiBuZmNhbGwoY2FsbGJhY2svKiwgLi4uYXJncyAqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG5cbiAgICBmYXBwbHkoY2FsbGJhY2ssIG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqICAgICAgLnRoZW4oY29uc29sZS5sb2cpXG4gKiAgICAgIC5kb25lKClcbiAqXG4gKi9cblEubmZiaW5kID0gbmZiaW5kO1xuUS5kZW5vZGVpZnkgPSBRLm5mYmluZDsgLy8gc3lub255bXNcbmZ1bmN0aW9uIG5mYmluZChjYWxsYmFjay8qLCAuLi5hcmdzICovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcblxuICAgICAgICBmYXBwbHkoY2FsbGJhY2ssIG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59XG5cblEubmJpbmQgPSBuYmluZDtcbmZ1bmN0aW9uIG5iaW5kKGNhbGxiYWNrLCB0aGlzQXJnIC8qLCAuLi4gYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcblxuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgZmFwcGx5KGJvdW5kLCBub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufVxuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2sgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5ucG9zdCA9IG5wb3N0O1xuUS5ubWFwcGx5ID0gbnBvc3Q7IC8vIHN5bm9ueW1zXG5mdW5jdGlvbiBucG9zdChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcblxuICAgIHBvc3Qob2JqZWN0LCBuYW1lLCBub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gbnNlbmQ7XG5RLm5pbnZva2UgPSBRLm5zZW5kOyAvLyBzeW5vbnltc1xuUS5ubWNhbGwgPSBRLm5zZW5kOyAvLyBzeW5vbnltc1xuZnVuY3Rpb24gbnNlbmQob2JqZWN0LCBuYW1lIC8qLCAuLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHBvc3Qob2JqZWN0LCBuYW1lLCBub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShwcm9taXNlLCBub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG59XG5cbi8vIEFsbCBjb2RlIGJlZm9yZSB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMuXG52YXIgcUVuZGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xuXG5yZXR1cm4gUTtcblxufSk7XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIvKlxuICogY3VydGFpbi5qcyAtIHRoZSBjdXJ0YWluIGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50YXRpb25cbiAqL1xuXG52YXIgY3VydGFpbiA9IHt9LFxuICAgIFphbmltbyA9IHJlcXVpcmUoJ3phbmltbycpLFxuICAgIF8kID0gcmVxdWlyZSgnLi8kJyk7XG5cbnZhciBzdGF0ZSA9IGZhbHNlLFxuICAgICRkb2N1bWVudGF0aW9uLFxuICAgICRhY3RpdmVBcmVhLFxuICAgICRzdGFyLFxuICAgICRoaWRkZW5BLFxuICAgIG9wZW5lZExlbmdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlM2QoMCwgLVwiICsgKHdpbmRvdy5pbm5lckhlaWdodCAtIDgwKSArIFwicHgsMClcIjtcbiAgICB9LFxuICAgIGhpZGRlbkxlbmdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlM2QoMCwgLVwiICsgKHdpbmRvdy5pbm5lckhlaWdodCAtIDMwKSArIFwicHgsMClcIjtcbiAgICB9LFxuICAgIG9wZW4gPSBmdW5jdGlvbiAoZWx0KSB7XG4gICAgICAgIHJldHVybiBaYW5pbW8udHJhbnNpdGlvbihlbHQsIFwidHJhbnNmb3JtXCIsIG9wZW5lZExlbmdodCgpLCA0MDAsIFwiZWFzZS1pbi1vdXRcIik7XG4gICAgfSxcbiAgICBoaWRlID0gZnVuY3Rpb24gKGVsdCkge1xuICAgICAgICByZXR1cm4gWmFuaW1vLnRyYW5zaXRpb24oZWx0LCBcInRyYW5zZm9ybVwiLCBoaWRkZW5MZW5naHQoKSwgNDAwLCBcImVhc2UtaW4tb3V0XCIpO1xuICAgIH0sXG4gICAgY2xvc2UgPSBaYW5pbW8udHJhbnNpdGlvbmYoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUzZCgwLDAsMClcIiwgNDAwLCBcImVhc2UtaW4tb3V0XCIpLFxuICAgIGRvd25TdGFyID0gWmFuaW1vLnRyYW5zaXRpb25mKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlM2QoMCwxOHB4LDApIHJvdGF0ZSgxNTBkZWcpXCIsIDIwMCwgXCJlYXNlLWluLW91dFwiKSxcbiAgICB1cFN0YXIgPSBaYW5pbW8udHJhbnNpdGlvbmYoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUzZCgwLDAsMClcIiwgMjAwLCBcImVhc2UtaW4tb3V0XCIpLFxuICAgIGVycm9yTG9nID0gZnVuY3Rpb24gKGVycikgeyBuZXcgRXJyb3IoZXJyLm1lc3NhZ2UpOyB9LFxuICAgIHJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoc3RhdGUpIFphbmltbygkZG9jdW1lbnRhdGlvbikudGhlbihoaWRlKS5kb25lKGVtcHR5LCBlbXB0eSk7XG4gICAgfSxcbiAgICBhbmltYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZihzdGF0ZSkge1xuICAgICAgICAgICAgc3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBaYW5pbW8oJGRvY3VtZW50YXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjbG9zZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKFphbmltby5mKCRzdGFyKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHVwU3RhciwgZXJyb3JMb2cpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIFphbmltbygkZG9jdW1lbnRhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKG9wZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihoaWRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oWmFuaW1vLmYoJHN0YXIpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZG93blN0YXIsIGVycm9yTG9nKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWN0aXZlQXJlYUFjdGlvbiA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICRoaWRkZW5BLmZvY3VzKCk7XG4gICAgICAgIHNldFRpbWVvdXQoYW5pbWF0ZSwgNTAwKTtcbiAgICB9O1xuXG5jdXJ0YWluLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgJGRvY3VtZW50YXRpb24gPSBfJC4kKFwiYXJ0aWNsZS5kb2N1bWVudGF0aW9uXCIpO1xuICAgICRhY3RpdmVBcmVhID0gXyQuJChcImRpdi5hY3RpdmUtYXJlYVwiKTtcbiAgICAkc3RhciA9IF8kLiQoXCIuY2hpcCBzcGFuXCIpO1xuICAgICRoaWRkZW5BID0gXyQuJChcIiNoaWRkZW4tYVwiKTtcbn07XG5cbmN1cnRhaW4uYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgaWYoIV8kLmlzVG91Y2hhYmxlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUpO1xuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm9yaWVudGF0aW9uY2hhbmdlXCIsIHJlc2l6ZSk7XG4gICAgICRhY3RpdmVBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXyQuaXNUb3VjaGFibGUgPyBcInRvdWNoc3RhcnRcIiA6IFwiY2xpY2tcIiwgYWN0aXZlQXJlYUFjdGlvbik7XG59O1xuXG5jdXJ0YWluLmFuaW1hdGUgPSBhbmltYXRlO1xubW9kdWxlLmV4cG9ydHMgPSBjdXJ0YWluO1xuIiwiLypcbiAqIGVkaXRvci5qc1xuICovXG5cbnZhciBlZGl0b3IgPSB7fSxcbiAgICBaYW5pbW8gPSByZXF1aXJlKCd6YW5pbW8nKSxcbiAgICBfJCA9IHJlcXVpcmUoJy4vJCcpLFxuICAgIHN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZScpLFxuICAgIHJ1bm5lciA9IHJlcXVpcmUoJy4vcnVubmVyJyk7XG5cbnZhciBFTVBUWV9TQ1JJUFQsXG4gICAgY3VycmVudFNjcmlwdCA9IDAsXG4gICAgbGFzdEVkaXRvclRvdWNoVFMgPSAwLFxuICAgIF9lZGl0b3IsXG4gICAgJGVkaXRvcixcbiAgICAkaGlkZGVuLFxuICAgICRzZWxlY3QsXG4gICAgJHBsYXlCdG4sXG4gICAgJHNhdmVCdG4sXG4gICAgJHRyYXNoQnRuLFxuICAgICRnaXRodWJCdG4sXG4gICAgJHNoYXJlQnRuLFxuICAgICRzdGFyLFxuICAgIHRvV2hpdGUgPSBaYW5pbW8udHJhbnNpdGlvbmYoXCJjb2xvclwiLCBcIiNGMEYxRjNcIiwgMTAwKSxcbiAgICB0b0dyZWVuID0gWmFuaW1vLnRyYW5zaXRpb25mKFwiY29sb3JcIiwgXCJncmVlblwiLCAxMDApLFxuICAgIGlzTW9iaWxlID0gL1dlYktpdC4qTW9iaWxlLip8QW5kcm9pZC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcbiAgICBjb2RlTWlycm9yID0gQ29kZU1pcnJvciB8fCB7fTtcblxuaWYgKGlzTW9iaWxlKSB7XG4gICAgdmFyIGNtID0geyBlbCA6IG51bGwgfTtcbiAgICBjb2RlTWlycm9yID0ge307XG4gICAgY29kZU1pcnJvci5mcm9tVGV4dEFyZWEgPSBmdW5jdGlvbiAoZWwsIG9wdGlvbnMpIHtcbiAgICAgICAgY20uZWwgPSBlbDsgcmV0dXJuIGNtO1xuICAgIH07XG4gICAgY20uZ2V0VmFsdWUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBjbS5lbC52YWx1ZTsgfTtcbiAgICBjbS5zZXRWYWx1ZSA9IGZ1bmN0aW9uIChjb2RlKSB7IGNtLmVsLnZhbHVlID0gY29kZTsgfTtcbn1cblxuZWRpdG9yLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgJGhpZGRlbiA9IF8kLiQoXCIjaGlkZGVuLWFcIik7XG4gICAgJGVkaXRvciA9IF8kLiQoXCJhcnRpY2xlLmVkaXRvclwiKTtcbiAgICAkc2VsZWN0ID0gXyQuJChcInNlbGVjdFwiLCAkZWRpdG9yKTtcbiAgICAkcGxheUJ0biA9IF8kLiQoXCJidXR0b24uaWNvbi1wbGF5XCIsICRlZGl0b3IpO1xuICAgICRzYXZlQnRuID0gXyQuJChcImJ1dHRvbi5pY29uLXNhdmVcIiwgJGVkaXRvcik7XG4gICAgJHRyYXNoQnRuID0gXyQuJChcImJ1dHRvbi5pY29uLXRyYXNoXCIsICRlZGl0b3IpO1xuICAgICRnaXRodWJCdG4gPSBfJC4kKFwiYnV0dG9uLmljb24tZ2l0aHViLWFsdFwiLCAkZWRpdG9yKTtcbiAgICAkc2hhcmVCdG4gPSBfJC4kKFwiYnV0dG9uLmljb24tc2hhcmVcIiwgJGVkaXRvcik7XG4gICAgJHN0YXIgPSBfJC4kKFwiLmNoaXAgc3BhblwiKTtcblxuICAgIF9lZGl0b3IgPSBjb2RlTWlycm9yLmZyb21UZXh0QXJlYShfJC4kKFwidGV4dGFyZWFcIiwgJGVkaXRvciksIHtcbiAgICAgICAgbGluZU51bWJlcnM6IHRydWUsXG4gICAgICAgIG1hdGNoQnJhY2tldHM6IHRydWUsXG4gICAgICAgIGluZGVudFVuaXQ6IDQsXG4gICAgICAgIGV4dHJhS2V5czogeyBcIkVudGVyXCIgOiBcIm5ld2xpbmVBbmRJbmRlbnRDb250aW51ZUNvbW1lbnRcIiB9XG4gICAgfSk7XG5cbiAgICBFTVBUWV9TQ1JJUFQgPSBfJC4kKFwiI2VtcHR5LXNjcmlwdC1oZWxwXCIpLmlubmVySFRNTDtcblxuICAgIGN1cnJlbnRTY3JpcHQgPSBzdG9yZS5oZWFkKCk7XG4gICAgZWRpdG9yLnBvcHVsYXRlU2VsZWN0KGN1cnJlbnRTY3JpcHQsIHN0b3JlKTtcbiAgICBlZGl0b3IubG9hZEV4YW1wbGUoY3VycmVudFNjcmlwdCwgc3RvcmUpO1xuXG4gICAgaWYoXyQuaXNUb3VjaGFibGUpICRlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgZWRpdG9yLm9uVG91Y2hTdGFydCk7XG4gICAgJHBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcihfJC5pc1RvdWNoYWJsZSA/IFwidG91Y2hzdGFydFwiIDogXCJjbGlja1wiLCBlZGl0b3Iub25QbGF5KTtcbiAgICAkc2F2ZUJ0bi5hZGRFdmVudExpc3RlbmVyKF8kLmlzVG91Y2hhYmxlID8gXCJ0b3VjaHN0YXJ0XCIgOiBcImNsaWNrXCIsIGVkaXRvci5vblNhdmUpO1xuICAgICR0cmFzaEJ0bi5hZGRFdmVudExpc3RlbmVyKF8kLmlzVG91Y2hhYmxlID8gXCJ0b3VjaHN0YXJ0XCIgOiBcImNsaWNrXCIsIGVkaXRvci5vblRyYXNoKTtcbiAgICAkZ2l0aHViQnRuLmFkZEV2ZW50TGlzdGVuZXIoXyQuaXNUb3VjaGFibGUgPyBcInRvdWNoc3RhcnRcIiA6IFwiY2xpY2tcIiwgZWRpdG9yLm9uR2l0aHViKTtcbiAgICAkc2hhcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihfJC5pc1RvdWNoYWJsZSA/IFwidG91Y2hzdGFydFwiIDogXCJjbGlja1wiLCBlZGl0b3Iub25TaGFyZSk7XG4gICAgJHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGVkaXRvci5vblNlbGVjdCk7XG4gICAgd2luZG93LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGVkaXRvci5vbktleWRvd24pO1xufTtcblxuZWRpdG9yLm9uS2V5ZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZigoZXZ0Lm1ldGFLZXkgfHwgZXZ0LmN0cmxLZXkpICYmIGV2dC5rZXlDb2RlID09PSA4Mykge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZWRpdG9yLm9uU2F2ZSgpO1xuICAgIH1cbiAgICBpZigoZXZ0Lm1ldGFLZXkgfHwgZXZ0LmN0cmxLZXkpICYmIGV2dC5rZXlDb2RlID09PSA2OSkge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZWRpdG9yLm9uUGxheSgpO1xuICAgIH1cbn1cblxuZWRpdG9yLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIgdCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgaWYoKHQtbGFzdEVkaXRvclRvdWNoVFMpIDwgNDAwKSAkaGlkZGVuLmZvY3VzKCk7XG4gICAgbGFzdEVkaXRvclRvdWNoVFMgPSB0O1xufTtcblxuZWRpdG9yLm9uUGxheSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICB0cnkge1xuICAgICAgICAkaGlkZGVuLmZvY3VzKCk7XG4gICAgICAgIHJ1bm5lci5ydW4oX2VkaXRvci5nZXRWYWx1ZSgpKTtcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgICBhbGVydChlcnIpO1xuICAgIH1cbn07XG5cbmVkaXRvci5vblNoYXJlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciB1cmwgPSBlbmNvZGVVUklDb21wb25lbnQoJ2h0dHA6Ly96YW5pbW8udXMvI3J1bm5lci8nICsgY3VycmVudFNjcmlwdCArIFwiL1wiICsgIHdpbmRvdy5idG9hKGVkaXRvci5nZXRWYWx1ZSgpKSksXG4gICAgICAgIHRleHQgPSBlbmNvZGVVUklDb21wb25lbnQoXCJhIHphbmltby5qcyBhbmltYXRpb246IFwiICsgY3VycmVudFNjcmlwdCksXG4gICAgICAgIHNoYXJlVXJsID0gJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P29yaWdpbmFsX3JlZmVyZXI9aHR0cCUzQSUyRiUyRnphbmltby51cyZ0ZXh0PScgKyB0ZXh0ICsgJyZ0d19wPXR3ZWV0YnV0dG9uJnVybD0nICsgdXJsO1xuICAgIHdpbmRvdy5vcGVuKHNoYXJlVXJsKTtcbn07XG5cbmVkaXRvci5vblNhdmUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgJGhpZGRlbi5mb2N1cygpO1xuICAgIGlmKCFzdG9yZS5zYXZlKCRzZWxlY3QudmFsdWUsIF9lZGl0b3IuZ2V0VmFsdWUoKSkpIHtcbiAgICAgICAgYWxlcnQoXCJDYW4ndCBvdmVyd3JpdGUgZXhhbXBsZSBzY3JpcHQhXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFphbmltbygkc3RhcilcbiAgICAgICAgICAgIC50aGVuKHRvR3JlZW4pXG4gICAgICAgICAgICAudGhlbih0b1doaXRlKVxuICAgICAgICAgICAgLnRoZW4odG9HcmVlbilcbiAgICAgICAgICAgIC50aGVuKHRvV2hpdGUpXG4gICAgICAgICAgICAudGhlbih0b0dyZWVuKVxuICAgICAgICAgICAgLnRoZW4odG9XaGl0ZSk7XG4gICAgfVxufTtcblxuZWRpdG9yLm9uVHJhc2ggPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgJGhpZGRlbi5mb2N1cygpO1xuICAgIGlmIChzdG9yZS5pc0RlZmF1bHRFeGFtcGxlKCRzZWxlY3QudmFsdWUpKSB7XG4gICAgICAgIGFsZXJ0KFwiQ2FuJ3QgZGVsZXRlIGV4YW1wbGUgc2NyaXB0IVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZihjb25maXJtKFwiRGVsZXRlIFwiICsgJHNlbGVjdC52YWx1ZSArIFwiID9cIikpIHtcbiAgICAgICAgc3RvcmUudHJhc2goJHNlbGVjdC52YWx1ZSk7XG4gICAgICAgIHZhciBoZWFkID0gc3RvcmUuaGVhZCgpO1xuICAgICAgICBpZihjdXJyZW50U2NyaXB0ID09PSAkc2VsZWN0LnZhbHVlKSBjdXJyZW50U2NyaXB0ID0gaGVhZDtcbiAgICAgICAgZWRpdG9yLnBvcHVsYXRlU2VsZWN0KGhlYWQsIHN0b3JlKTtcbiAgICAgICAgZWRpdG9yLmxvYWRFeGFtcGxlKGhlYWQsIHN0b3JlKTtcbiAgICB9XG59O1xuXG5lZGl0b3Iub25HaXRodWIgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgJGhpZGRlbi5mb2N1cygpO1xuICAgIGlmKGNvbmZpcm0oXCJWaXNpdCBvbiBHaXRodWI/XCIpKSB3aW5kb3cub3BlbihcImh0dHA6Ly9naXRodWIuY29tL3BldXRldHJlL1phbmltb1wiKTtcbn07XG5cbmVkaXRvci5hZGQgPSBmdW5jdGlvbiAobmFtZSwgY29kZSkge1xuICAgIGlmIChzdG9yZS5zYXZlKG5hbWUsIGNvZGUpKSB7XG4gICAgICAgIF9lZGl0b3Iuc2V0VmFsdWUoY29kZSk7XG4gICAgICAgIGVkaXRvci5wb3B1bGF0ZVNlbGVjdChuYW1lLCBzdG9yZSk7XG4gICAgICAgICRzZWxlY3QudmFsdWUgPSBuYW1lO1xuICAgICAgICBjdXJyZW50U2NyaXB0ID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAkc2VsZWN0LnZhbHVlID0gY3VycmVudFNjcmlwdDtcbiAgICAgICAgYWxlcnQoXCJDYW4ndCBvdmVyd3JpdGUgZXhhbXBsZSBzY3JpcHQhXCIpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzZWxlY3QudmFsdWUgPSBjdXJyZW50U2NyaXB0O1xuICAgICAgICB9LDEwKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbmVkaXRvci5vblNlbGVjdCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAkaGlkZGVuLmZvY3VzKCk7XG5cbiAgICBpZihldnQudGFyZ2V0LnZhbHVlID09PSBcIk5ld1wiKSB7XG4gICAgICAgIHZhciBuYW1lID0gd2luZG93LnByb21wdChcIlNjcmlwdCBuYW1lOlwiLCBcIm15LXRlc3RcIiksXG4gICAgICAgICAgICB0cmltZWROYW1lID0gXCJcIjtcbiAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5sZW5ndGggPiAwICYmIG5hbWUudHJpbSgpICE9PSBcIk5ld1wiKSB7XG4gICAgICAgICAgICB0cmltZWROYW1lID0gbmFtZS50cmltKCkucmVwbGFjZSgvIC9nLCAnXycpLnJlcGxhY2UoLy0vZywgJ18nKTtcbiAgICAgICAgICAgIGVkaXRvci5hZGQodHJpbWVkTmFtZSwgRU1QVFlfU0NSSVBUKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYW1lICE9IG51bGwpIGFsZXJ0KFwiU2NyaXB0IG5hbWUgaXMgaW52YWxpZCFcIik7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2VsZWN0LnZhbHVlID0gY3VycmVudFNjcmlwdDtcbiAgICAgICAgICAgIH0sMzApO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWRpdG9yLmxvYWRFeGFtcGxlKGV2dC50YXJnZXQudmFsdWUsIHN0b3JlKTtcbiAgICAgICAgY3VycmVudFNjcmlwdCA9IGV2dC50YXJnZXQudmFsdWU7XG4gICAgfVxufTtcblxuZWRpdG9yLnBvcHVsYXRlU2VsZWN0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgaXRlbXMgPSBzdG9yZS5nZXRMaXN0KCksXG4gICAgICAgIGV4YW1wbGVTY3JpcHRzID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChleCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0b3JlLmlzRGVmYXVsdEV4YW1wbGUoZXgpO1xuICAgICAgICB9KSxcbiAgICAgICAgdXNlclNjcmlwdHMgPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gIXN0b3JlLmlzRGVmYXVsdEV4YW1wbGUoZXgpO1xuICAgICAgICB9KSxcbiAgICAgICAgY3JlYXRlT3B0aW9uID0gZnVuY3Rpb24gKHZhbCwgY29udGFpbmVyKSB7XG4gICAgICAgICAgICB2YXIgb3AgPSBfJC5ET00oXCJvcHRpb25cIik7XG4gICAgICAgICAgICBvcC5pbm5lckhUTUwgPSB2YWw7XG4gICAgICAgICAgICBvcC52YWx1ZSA9IHZhbDtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChvcCk7XG4gICAgICAgICAgICByZXR1cm4gb3A7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGdyb3VwQ29tbWFuZHMgPSBfJC5ET00oXCJvcHRncm91cFwiKSxcbiAgICAgICAgb3B0Z3JvdXBFeGFtcGxlcyA9IF8kLkRPTShcIm9wdGdyb3VwXCIpLFxuICAgICAgICBvcHRncm91cFVzZXIgPSBfJC5ET00oXCJvcHRncm91cFwiKTtcblxuICAgICRzZWxlY3QuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBvcHRncm91cENvbW1hbmRzLmxhYmVsID0gXCJDb21tYW5kc1wiO1xuICAgIG9wdGdyb3VwRXhhbXBsZXMubGFiZWwgPSBcIkV4YW1wbGVzXCI7XG4gICAgb3B0Z3JvdXBVc2VyLmxhYmVsID0gXCJTY3JpcHRzXCI7XG4gICAgJHNlbGVjdC5hcHBlbmRDaGlsZChvcHRncm91cENvbW1hbmRzKTtcbiAgICBjcmVhdGVPcHRpb24oXCJOZXdcIiwgJHNlbGVjdCk7XG4gICAgJHNlbGVjdC5hcHBlbmRDaGlsZChvcHRncm91cEV4YW1wbGVzKTtcbiAgICBleGFtcGxlU2NyaXB0cy5mb3JFYWNoKGZ1bmN0aW9uIChleCkge1xuICAgICAgICB2YXIgb3AgPSBjcmVhdGVPcHRpb24oZXgsICRzZWxlY3QpO1xuICAgICAgICBpZiAoZXggPT0gbmFtZSkgb3Auc2VsZWN0ZWQgPSBcInNlbGVjdGVkXCI7XG4gICAgfSk7XG4gICAgJHNlbGVjdC5hcHBlbmRDaGlsZChvcHRncm91cFVzZXIpO1xuICAgIHVzZXJTY3JpcHRzLmZvckVhY2goZnVuY3Rpb24gKHNjcmlwdCkge1xuICAgICAgICB2YXIgb3AgPSBjcmVhdGVPcHRpb24oc2NyaXB0LCAkc2VsZWN0KTtcbiAgICAgICAgaWYgKHNjcmlwdCA9PSBuYW1lKSBvcC5zZWxlY3RlZCA9IFwic2VsZWN0ZWRcIjtcbiAgICB9KTtcbn07XG5cbmVkaXRvci5sb2FkRXhhbXBsZSA9IGZ1bmN0aW9uIChuYW1lKSB7IF9lZGl0b3Iuc2V0VmFsdWUoc3RvcmUuZ2V0KG5hbWUpKTsgfTtcblxuZWRpdG9yLmdldFZhbHVlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX2VkaXRvci5nZXRWYWx1ZSgpOyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVkaXRvcjtcbiIsIi8qXG4gKiBydW5uZXIuanMgLSB0aGUgc2NyaXB0IHJ1bm5lclxuICovXG5cbnZhciBydW5uZXIgPSB7fSxcbiAgICBfJCA9IHJlcXVpcmUoJy4vJCcpLFxuICAgIFEgPSByZXF1aXJlKCdxJyksXG4gICAgWmFuaW1vID0gcmVxdWlyZSgnemFuaW1vJyk7XG5cbnZhciAkYW5pbVNjcmVlbixcbiAgICBlbGVtZW50cyxcbiAgICBydW5uaW5nID0gZmFsc2U7XG5cbnJ1bm5lci5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICRhbmltU2NyZWVuID0gXyQuJChcImFydGljbGUuYW5pbS1zY3JlZW5cIik7XG59O1xuXG5ydW5uZXIuaGlkZVNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAkYW5pbVNjcmVlbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG59O1xuXG5ydW5uZXIuc2hvd1NjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAkYW5pbVNjcmVlbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xufTtcblxucnVubmVyLnJ1biA9IGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsZW1lbnRzID0gW107XG4gICAgICAgICAgICB2YXIgcCA9IChuZXcgRnVuY3Rpb24gKFwiUVwiLCBcIlphbmltb1wiLCBcImNyZWF0ZVwiLCBcInN0YXJ0XCIsIFwid2luZG93XCIsIFwiZG9jdW1lbnRcIiwgY29kZSkpLmNhbGwoXG4gICAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgICAgUSxcbiAgICAgICAgICAgICAgICBaYW5pbW8sXG4gICAgICAgICAgICAgICAgcnVubmVyLmNyZWF0ZSxcbiAgICAgICAgICAgICAgICBydW5uZXIuc3RhcnQsXG4gICAgICAgICAgICAgICAge30se31cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZihRLmlzUHJvbWlzZShwKSkgcmV0dXJuIHAudGhlbihydW5uZXIuZG9uZSwgcnVubmVyLmZhaWwpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUnVubmVyIGV4Y2VwdGlvbiwgeW91IG5lZWQgdG8gcmV0dXJuIGEgcHJvbWlzZSFcIik7XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBydW5uZXIuZG9uZSgpLnRoZW4oZnVuY3Rpb24gKCkgeyBhbGVydChlcnIpOyB9KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnJ1bm5lci5jcmVhdGUgPSBmdW5jdGlvbiAoZGVmaW5pdGlvbnMpIHtcbiAgICB2YXIgZWwsIGF0dHIsIGl0ZW1zID0gW107XG4gICAgZGVmaW5pdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoZGVmKSB7XG4gICAgICAgIGVsID0gXyQuRE9NKFwiZGl2XCIpO1xuICAgICAgICBlbC5zdHlsZS53aWR0aCA9IFwiMTAwcHhcIjtcbiAgICAgICAgZWwuc3R5bGUuaGVpZ2h0ID0gXCIxMDBweFwiO1xuICAgICAgICBlbC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJyZ2IoMTE4LCAxODksIDI1NSlcIjtcbiAgICAgICAgZWwuc3R5bGUuekluZGV4ID0gMTAwMDA7XG4gICAgICAgIGZvcihhdHRyIGluIGRlZikge1xuICAgICAgICAgICAgZWwuc3R5bGVbYXR0cl0gPSBkZWZbYXR0cl07XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgICAgIGl0ZW1zLnB1c2goZWwpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlbXM7XG59O1xuXG5ydW5uZXIuc3RhcnQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAkYW5pbVNjcmVlbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgIHJldHVybiBRLmRlbGF5KDIwMClcbiAgICAgICAgICAgIC50aGVuKFphbmltby5mKCRhbmltU2NyZWVuKSlcbiAgICAgICAgICAgIC50aGVuKFphbmltby50cmFuc2l0aW9uZihcIm9wYWNpdHlcIiwgMSwgMjAwKSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVsOyB9KTtcbn07XG5cbnJ1bm5lci5jbGVhbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbCk7XG4gICAgfSk7XG59O1xuXG5ydW5uZXIuZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBydW5uZXIuY2xlYW4oKTtcbiAgICByZXR1cm4gWmFuaW1vLnRyYW5zaXRpb24oJGFuaW1TY3JlZW4sIFwib3BhY2l0eVwiLCAwLCAyMDApXG4gICAgICAgICAgICAgICAgIC50aGVuKHJ1bm5lci5oaWRlU2NyZWVuLCBydW5uZXIuaGlkZVNjcmVlbilcbiAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gUS5kZWxheSgyMDApLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgIH0pfSk7XG59O1xuXG5ydW5uZXIuZmFpbCA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICBydW5uZXIuY2xlYW4oKTtcbiAgICByZXR1cm4gWmFuaW1vLnRyYW5zaXRpb24oJGFuaW1TY3JlZW4sIFwib3BhY2l0eVwiLCAwLCAyMDApXG4gICAgICAgICAgICAgICAgIC50aGVuKHJ1bm5lci5oaWRlU2NyZWVuLCBydW5uZXIuaGlkZVNjcmVlbilcbiAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gUS5kZWxheSgyMDApLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgIH0pfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJ1bm5lcjtcbiIsIi8qKlxuICogcXN0YXJ0LmpzIC0gRE9NIHJlYWR5IHByb21pc2lmaWVkIHdpdGggUVxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBRc3RhcnQgPSBkZWZpbml0aW9uKCk7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFEgPSB3aW5kb3cuUSB8fCByZXF1aXJlKCdxJyksXG4gICAgICAgICAgICBkID0gUS5kZWZlcigpLFxuICAgICAgICAgICAgc3VjY2Vzc8aSID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3LGkik7XG4gICAgICAgICAgICAgICAgZC5yZXNvbHZlKHdpbmRvdy5kb2N1bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3LGkiA9IGZ1bmN0aW9uIChlcnIpIHsgZC5yZWplY3QoZXJyKTsgfTtcblxuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSBzdWNjZXNzxpIoKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGVycm9yxpIsIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGQucHJvbWlzZTtcbiAgICB9O1xufSk7XG4iLCIvLyBaYW5pbW8uanMgLSBQcm9taXNlIGJhc2VkIENTUzMgdHJhbnNpdGlvbnNcbi8vIChjKSAyMDExLTIwMTMgUGF1bCBQYW5zZXJyaWV1XG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBaYW5pbW8gPSBkZWZpbml0aW9uKCk7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgUSA9IHdpbmRvdy5RIHx8IHJlcXVpcmUoJ3EnKTtcblxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIHJlcXVlc3RBbmltYXRpb25GcmFtZSBpbiBhIGNyb3NzIGJyb3dzZXIgd2F5LlxuICAgICAqIEBhdXRob3IgcGF1bGlyaXNoIC8gaHR0cDovL3BhdWxpcmlzaC5jb20vXG4gICAgICovXG4gICAgaWYgKCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9ICggZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiggLyogZnVuY3Rpb24gRnJhbWVSZXF1ZXN0Q2FsbGJhY2sgKi8gY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgLyogRE9NRWxlbWVudCBFbGVtZW50ICovIGVsZW1lbnQgKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoIGNhbGxiYWNrLCAxMDAwIC8gNjAgKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfSApKCk7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogUHJpdmF0ZSBoZWxwZXIgZGVhbGluZyB3aXRoIHByZWZpeCBhbmQgbm9ybWFsaXppbmdcbiAgICAgKiBjc3MgcHJvcGVydGllcywgdHJhbnNpdGlvbi90cmFuc2Zvcm0gdmFsdWVzLlxuICAgICAqL1xuICAgIHZhciBUID0gKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgdmFyIF9tYXRjaFBhcmVudGhlc2lzID0gLyhcXCguKz9cXCkpL2csXG4gICAgICAgICAgICBfemVyb3BpeGVsID0gL14wcHgkL2csXG4gICAgICAgICAgICBfemVybyA9IFwiMFwiLFxuICAgICAgICAgICAgX3NwYWNlID0gLyAvZyxcbiAgICAgICAgICAgIF9ub3JtUmVnZXggPSAvXFwtKFthLXpdKS9nLFxuICAgICAgICAgICAgX2VtcHR5U3RyaW5nID0gXCJcIixcbiAgICAgICAgICAgIF90cmFuc2l0aW9uZW5kID0gXCJ0cmFuc2l0aW9uZW5kXCIsXG4gICAgICAgICAgICBfdHJhbnNpdGlvbiA9IFwidHJhbnNpdGlvblwiLFxuICAgICAgICAgICAgX3ByZWZpeCA9IG51bGwsXG4gICAgICAgICAgICBfZHVtbXkgPSBudWxsLFxuICAgICAgICAgICAgX2R1bW15VHJhbnNpdGlvbiA9IFwib3BhY2l0eSAxMDBtcyBsaW5lYXIgMHNcIixcbiAgICAgICAgICAgIF9yZXByID0gZnVuY3Rpb24gKHYsIGQsIHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdiArIFwiIFwiICsgZCArIFwibXMgXCIgKyAodCB8fCBcImxpbmVhclwiKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfcHJlZml4ZWQgPSB7IFwidHJhbnNmb3JtXCI6IFwiXCIgfSxcbiAgICAgICAgICAgIF9ub3JtUmVwbGFjZWYgPSBmdW5jdGlvbihtLCBnKSB7IHJldHVybiBnLnRvVXBwZXJDYXNlKCk7IH0sXG4gICAgICAgICAgICBfbm9ybUNTU1ZhbCA9IGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gbWF0Y2guc3Vic3RyKDEsIG1hdGNoLmxlbmd0aC0yKS5zcGxpdChcIixcIiksIHJzdCA9IFtdO1xuICAgICAgICAgICAgICAgIGFyZ3MuZm9yRWFjaChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJzdC5wdXNoKGFyZy5yZXBsYWNlKF9zcGFjZSwgX2VtcHR5U3RyaW5nKS5yZXBsYWNlKF96ZXJvcGl4ZWwsIF96ZXJvKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiKFwiICsgcnN0LmpvaW4oXCIsXCIpICsgXCIpXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX25vcm0gPSBmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IHBbMF0gPT09IFwiLVwiID8gcC5zdWJzdHIoMSwgcC5sZW5ndGgtMSkgOiBwO1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eS5yZXBsYWNlKF9ub3JtUmVnZXgsIF9ub3JtUmVwbGFjZWYpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9ub3JtVmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTmFOKHZhbCkgPyB2YWwucmVwbGFjZShfbWF0Y2hQYXJlbnRoZXNpcywgX25vcm1DU1NWYWwpIDogdmFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBkZXRlY3QgdHJhbnNpdGlvbiBmZWF0dXJlXG4gICAgICAgICAgICBpZiggJ1dlYmtpdFRyYW5zaXRpb24nIGluIGRvYy5ib2R5LnN0eWxlICkge1xuICAgICAgICAgICAgICAgIF90cmFuc2l0aW9uZW5kID0gJ3dlYmtpdFRyYW5zaXRpb25FbmQnO1xuICAgICAgICAgICAgICAgIF9wcmVmaXggPSBcIndlYmtpdFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIF9wcmVmaXhlZClcbiAgICAgICAgICAgICAgICBfcHJlZml4ZWRbcF0gPSBfcHJlZml4ID8gXCItXCIgKyBfcHJlZml4ICsgXCItXCIgKyBwIDogcDtcblxuICAgICAgICAgICAgX3RyYW5zaXRpb24gPSBfcHJlZml4ID8gX3ByZWZpeCArIFwiLVwiICsgX3RyYW5zaXRpb24gOiBfdHJhbnNpdGlvblxuICAgICAgICAgICAgX3RyYW5zaXRpb24gPSBfbm9ybShfdHJhbnNpdGlvbik7XG4gICAgICAgICAgICBfZHVtbXkgPSBkb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIF9kdW1teVRyYW5zaXRpb24gPSBfbm9ybVZhbHVlKF9kdW1teVRyYW5zaXRpb24pO1xuICAgICAgICAgICAgX2R1bW15LnN0eWxlW190cmFuc2l0aW9uXSA9IF9kdW1teVRyYW5zaXRpb247XG4gICAgICAgICAgICBfZHVtbXkgPSBfbm9ybVZhbHVlKF9kdW1teS5zdHlsZVtfdHJhbnNpdGlvbl0pO1xuXG4gICAgICAgICAgICBpZiAoX2R1bW15ID09PSBfZHVtbXlUcmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgX3JlcHIgPSBmdW5jdGlvbiAodiwgZCwgdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdiArIFwiIFwiICsgZCArIFwibXMgXCIgKyAodCB8fCBcImxpbmVhclwiKSArIFwiIDBzXCI7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gcHJlZml4ZWQgdHJhbnNpdGlvbiBzdHJpbmdcbiAgICAgICAgICAgIHQgOiBfdHJhbnNpdGlvbixcbiAgICAgICAgICAgIC8vIHRyYW5zZm9ybSBhdHRyXG4gICAgICAgICAgICB0cmFuc2Zvcm0gOiBfbm9ybShfcHJlZml4ZWRbXCJ0cmFuc2Zvcm1cIl0pLFxuICAgICAgICAgICAgLy8gcHJlZml4ZWQgdHJhbnNpdGlvbiBlbmQgZXZlbnQgc3RyaW5nXG4gICAgICAgICAgICB0cmFuc2l0aW9uZW5kIDogX3RyYW5zaXRpb25lbmQsXG4gICAgICAgICAgICAvLyBub3JtYWxpemUgY3NzIHByb3BlcnR5XG4gICAgICAgICAgICBub3JtIDogX25vcm0sXG4gICAgICAgICAgICAvLyBwcmVmaXggYSBjc3MgcHJvcGVydHkgaWYgbmVlZGVkXG4gICAgICAgICAgICBwcmVmaXggOiBmdW5jdGlvbiAocCkgeyByZXR1cm4gX3ByZWZpeGVkW3BdID8gX3ByZWZpeGVkW3BdIDogcDsgfSxcbiAgICAgICAgICAgIHJlcHIgOiBfcmVwcixcbiAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSBhIGNzcyB0cmFuc2Zvcm1hdGlvbiBzdHJpbmcgbGlrZVxuICAgICAgICAgICAgLy8gXCJ0cmFuc2xhdGUoMzQwcHgsIDBweCwgMjMwcHgpIHJvdGF0ZSgzNDBkZWcgKVwiXG4gICAgICAgICAgICAvLyAtPiBcInRyYW5zbGF0ZSgzNDBweCwwLDIzMHB4KSByb3RhdGUoMzQwZGVnKVwiXG4gICAgICAgICAgICBub3JtVmFsdWUgOiBfbm9ybVZhbHVlXG4gICAgICAgIH07XG4gICAgfSkod2luZG93LmRvY3VtZW50KSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdWxmaWxsZWQgcHJvbWlzZSB3cmFwcGluZyB0aGUgZ2l2ZW4gRE9NIGVsZW1lbnQuXG4gICAgICovXG4gICAgWiA9IGZ1bmN0aW9uIChkb21FbHQpIHtcbiAgICAgICAgaWYgKGRvbUVsdCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gUS5yZXNvbHZlKGRvbUVsdCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihRLmlzUHJvbWlzZShkb21FbHQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9tRWx0LnRoZW4oWik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUS5yZWplY3QobmV3IEVycm9yKFwiWmFuaW1vIHJlcXVpcmUgYW4gSFRNTEVsZW1lbnQsIG9yIGEgcHJvbWlzZSBvZiBhbiBIVE1MRWxlbWVudFwiKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gcHJpdmF0ZSBoZWxwZXIgdG8gYWRkIGEgdHJhbnNpdGlvblxuICAgIGFkZCA9IGZ1bmN0aW9uIChkb21FbHQsIGF0dHIsIHZhbHVlLCBkdXJhdGlvbiwgdGltaW5nKSB7XG4gICAgICAgIGF0dHIgPSBULnByZWZpeChhdHRyKTtcbiAgICAgICAgaWYgKGRvbUVsdC5zdHlsZVtULnRdKSB7XG4gICAgICAgICAgICBkb21FbHQuc3R5bGVbVC50XSA9IGRvbUVsdC5zdHlsZVtULnRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIsIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgVC5yZXByKGF0dHIsIGR1cmF0aW9uLCB0aW1pbmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZG9tRWx0LnN0eWxlW1QudF0gPSBULnJlcHIoYXR0ciwgZHVyYXRpb24sIHRpbWluZyk7XG4gICAgICAgIH1cbiAgICAgICAgZG9tRWx0LnN0eWxlW1Qubm9ybShhdHRyKV0gPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gcHJpdmF0ZSBoZWxwZXIgdG8gcmVtb3ZlIGEgdHJhbnNpdGlvblxuICAgIHJlbW92ZSA9IGZ1bmN0aW9uIChkb21FbHQsIGF0dHIsIHZhbHVlLCBkdXJhdGlvbiwgdGltaW5nKSB7XG4gICAgICAgIHZhciBwcmVmaXhlZEF0dHIgPSBULnByZWZpeChhdHRyKSxcbiAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhkb21FbHQuX3phbmltbyk7XG4gICAgICAgIGlmKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IGF0dHIpIGRvbUVsdC5zdHlsZVtULnRdID0gXCJcIjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIGEgdHJhbnNpdGlvbiBvbiB0aGUgZ2l2ZW4gRE9NIGVsZW1lbnQgYW5kIHJldHVybnNcbiAgICAgKiBhIHByb21pc2Ugd3JhcHBpbmcgdGhlIERPTSBlbGVtZW50LlxuICAgICAqL1xuICAgIFoudHJhbnNpdGlvbiA9IGZ1bmN0aW9uIChkb21FbHQsIGF0dHIsIHZhbHVlLCBkdXJhdGlvbiwgdGltaW5nKSB7XG4gICAgICAgIHZhciBkID0gUS5kZWZlcigpLCB0aW1lb3V0LFxuICAgICAgICAgICAgY2IgPSBmdW5jdGlvbiAoY2xlYXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGltZW91dCkgeyBjbGVhclRpbWVvdXQodGltZW91dCk7IHRpbWVvdXQgPSBudWxsOyB9XG4gICAgICAgICAgICAgICAgcmVtb3ZlKGRvbUVsdCwgYXR0ciwgdmFsdWUsIGR1cmF0aW9uLCB0aW1pbmcpO1xuICAgICAgICAgICAgICAgIGRvbUVsdC5yZW1vdmVFdmVudExpc3RlbmVyKFQudHJhbnNpdGlvbmVuZCwgY2JUcmFuc2l0aW9uZW5kKTtcbiAgICAgICAgICAgICAgICBpZiAoY2xlYXIpIHsgZGVsZXRlIGRvbUVsdC5femFuaW1vW2F0dHJdOyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2JUcmFuc2l0aW9uZW5kID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIGlmKFQubm9ybShldnQucHJvcGVydHlOYW1lKSA9PT0gVC5ub3JtKFQucHJlZml4KGF0dHIpKSkge1xuICAgICAgICAgICAgICAgICAgICBjYih0cnVlKTsgZC5yZXNvbHZlKGRvbUVsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoIShkb21FbHQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGQucmVqZWN0KG5ldyBFcnJvcihcIlphbmltbyB0cmFuc2l0aW9uOiBubyBET00gZWxlbWVudCFcIikpO1xuICAgICAgICAgICAgcmV0dXJuIGQucHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICBpZih3aW5kb3cuaXNOYU4ocGFyc2VJbnQoZHVyYXRpb24sIDEwKSkpIHtcbiAgICAgICAgICAgIGQucmVqZWN0KG5ldyBFcnJvcihcIlphbmltbyB0cmFuc2l0aW9uOiBkdXJhdGlvbiBtdXN0IGJlIGFuIGludGVnZXIhXCIpKTtcbiAgICAgICAgICAgIHJldHVybiBkLnByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICBkb21FbHQuYWRkRXZlbnRMaXN0ZW5lcihULnRyYW5zaXRpb25lbmQsIGNiVHJhbnNpdGlvbmVuZCk7XG5cbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhZGQoZG9tRWx0LCBhdHRyLCB2YWx1ZSwgZHVyYXRpb24sIHRpbWluZyk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhd1ZhbCA9IGRvbUVsdC5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKFQucHJlZml4KGF0dHIpKSxcbiAgICAgICAgICAgICAgICAgICAgZG9tVmFsID0gVC5ub3JtVmFsdWUocmF3VmFsKSxcbiAgICAgICAgICAgICAgICAgICAgZ2l2ZW5WYWwgPSBULm5vcm1WYWx1ZSh2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBjYih0cnVlKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tVmFsID09PSBnaXZlblZhbCkgeyBkLnJlc29sdmUoZG9tRWx0KTsgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkLnJlamVjdCggbmV3IEVycm9yKFwiWmFuaW1vIHRyYW5zaXRpb246IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICArIGRvbUVsdC5pZCArIFwiIHdpdGggXCIgKyBhdHRyICsgXCIgPSBcIiArIGdpdmVuVmFsXG4gICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBET00gdmFsdWU9XCIgKyBkb21WYWxcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZHVyYXRpb24gKyAyMCApO1xuXG4gICAgICAgICAgICBkb21FbHQuX3phbmltbyA9IGRvbUVsdC5femFuaW1vIHx8IHsgfTtcbiAgICAgICAgICAgIGlmKGRvbUVsdC5femFuaW1vW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgZG9tRWx0Ll96YW5pbW9bYXR0cl0uZGVmZXIucmVqZWN0KG5ldyBFcnJvcihcIlphbmltbyB0cmFuc2l0aW9uIFwiXG4gICAgICAgICAgICAgICAgICAgICsgZG9tRWx0LmlkICsgXCIgd2l0aCBcIlxuICAgICAgICAgICAgICAgICAgICArIGF0dHIgKyBcIj1cIiArIGRvbUVsdC5femFuaW1vW2F0dHJdLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICsgXCIgc3RvcHBlZCBieSB0cmFuc2l0aW9uIHdpdGggXCIgKyBhdHRyICsgXCI9XCIgKyB2YWx1ZVxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgIGRvbUVsdC5femFuaW1vW2F0dHJdLmNiKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb21FbHQuX3phbmltb1thdHRyXSA9IHtjYjogY2IsIHZhbHVlOiB2YWx1ZSwgZGVmZXI6IGR9O1xuXG4gICAgICAgIH0sIGRvbUVsdCk7XG5cbiAgICAgICAgcmV0dXJuIGQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB3cmFwcGluZyBaYW5pbW8udHJhbnNpdGlvbigpLlxuICAgICAqL1xuICAgIFoudHJhbnNpdGlvbmYgPSBmdW5jdGlvbiAoYXR0ciwgdmFsdWUsIGR1cmF0aW9uLCB0aW1pbmcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlbHQpIHtcbiAgICAgICAgICAgIHJldHVybiBaLnRyYW5zaXRpb24oZWx0LCBhdHRyLCB2YWx1ZSwgZHVyYXRpb24sIHRpbWluZyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFwcGx5IGEgQ1NTMyB0cmFuc2Zvcm0gdmFsdWUgdG8gYSBnaXZlbiBET00gZWxlbWVudFxuICAgICAqIGFuZCByZXR1cm5zIGEgcHJvbWlzZSB3cmFwcGluZyB0aGUgRE9NIGVsZW1lbnQuXG4gICAgICovXG4gICAgWi50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoZWx0LCB2YWx1ZSwgb3ZlcndyaXRlKSB7XG4gICAgICAgIHZhciBkID0gUS5kZWZlcigpO1xuXG4gICAgICAgIGlmICghKGVsdCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgZC5yZWplY3QobmV3IEVycm9yKFwiWmFuaW1vIHRyYW5zZm9ybTogbm8gRE9NIGVsZW1lbnQhXCIpKTtcbiAgICAgICAgICAgIHJldHVybiBkLnByb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihlbHQuX3phbmltbyAmJiBlbHQuX3phbmltby5oYXNPd25Qcm9wZXJ0eShcInRyYW5zZm9ybVwiKSkge1xuICAgICAgICAgICAgZWx0Ll96YW5pbW9bXCJ0cmFuc2Zvcm1cIl0uZGVmZXIucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlphbmltbyB0cmFuc2l0aW9uIFwiICsgZWx0LmlkICsgXCIgd2l0aCB0cmFuc2Zvcm09XCJcbiAgICAgICAgICAgICAgICArIGVsdC5femFuaW1vW1widHJhbnNmb3JtXCJdLnZhbHVlXG4gICAgICAgICAgICAgICAgKyBcIiBzdG9wcGVkIGJ5IHRyYW5zZm9ybT1cIiArIHZhbHVlXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIGVsdC5femFuaW1vW1widHJhbnNmb3JtXCJdLmNiKCk7XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVsdC5zdHlsZVtULnRyYW5zZm9ybV0gPVxuICAgICAgICAgICAgICAgICFvdmVyd3JpdGUgPyBlbHQuc3R5bGVbVC50cmFuc2Zvcm1dICsgXCIgXCIgKyB2YWx1ZSA6IHZhbHVlO1xuICAgICAgICAgICAgZC5yZXNvbHZlKGVsdCk7XG4gICAgICAgIH0sIGVsdCk7XG4gICAgICAgIHJldHVybiBkLnByb21pc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gd3JhcHBpbmcgWmFuaW1vLnRyYW5zZm9ybSgpLlxuICAgICAqL1xuICAgIFoudHJhbnNmb3JtZiA9IGZ1bmN0aW9uICh2YWx1ZSwgb3ZlcndyaXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gWi50cmFuc2Zvcm0oZWx0LCB2YWx1ZSwgb3ZlcndyaXRlKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB3cmFwcGluZyBaYW5pbW8oKS5cbiAgICAgKi9cbiAgICBaLmYgPSBmdW5jdGlvbiAoZWx0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gWihlbHQpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBOZWVkZWQgdG8gcnVuIHBhcmFsbGVsIFphbmltbyBhbmltYXRpb25zLlxuICAgICAqL1xuICAgIFouYWxsID0gZnVuY3Rpb24gKGZsaXN0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBRLmFsbFJlc29sdmVkKGZsaXN0Lm1hcChmdW5jdGlvbiAoZikgeyByZXR1cm4gZihlbCk7IH0pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWplY3RlZCA9IHBsaXN0LmZpbHRlcihmdW5jdGlvbiAocCkgeyByZXR1cm4gUS5pc1JlamVjdGVkKHApOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHJlamVjdGVkLmxlbmd0aCkgcmV0dXJuIFEucmVqZWN0KHJlamVjdGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGVsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBaLl9UID0gVDtcblxuICAgIHJldHVybiBaO1xufSkoKTtcblxufSk7XG4iXX0=
;
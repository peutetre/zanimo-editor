/**
 * appcache.js
 */

var confirm = require('./overlays/confirm'),
    appCache = window.applicationCache,
    cache = {};

cache.update = function () {
    if (appCache.status == appCache.UPDATEREADY) {
        appCache.swapCache();
        return confirm.confirm(
                "Update available",
                "Do you want to install the new version now?"
            ).then(function (rslt) {
                if(rslt) window.location.reload();
            });
    }
};

module.exports = cache;

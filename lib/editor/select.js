/*
 * select.js
 */

"use strict";

var Q = require('q'),
    data = require('../data'),
    $ = require('../$'),

    select = {},
    options = null,
    $select = null;

select.init = function (f, opts) {
    options = opts;
    $select = $.$("article.editor select");

    if($.detect.firefox) {
        $select.style.MozBoxSizing = 'content-box';
        $select.style.padding = '12px 30px 0 10px';
    }

    $select.addEventListener("change", function (evt) {
        f(evt.target.value.trim(), evt.target.selectedIndex);
    });
};

select.render = function (name) {
    var demoItems = data.list(data.types[0]),
        localItems = data.list(data.types[1]),
        publicGistItems = data.list(data.types[2])
            .then(function (l) { return l; }, function (err) { return []; }),
        privateGistItems = data.list(data.types[3])
            .then(function (l) { return l; }, function (err) { return []; }),
        createOption = function (val, container) {
            var op = $.DOM("option");
            op.innerHTML = val;
            op.value = val;
            container.appendChild(op);
            return op;
        },
        optgroupCommands = $.DOM("optgroup"),
        optgroupDemos = $.DOM("optgroup"),
        optgroupLocal = $.DOM("optgroup"),
        optGroupPublicGists = $.DOM("optgroup"),
        optGroupPrivateGists = $.DOM("optgroup");

    return Q.all([demoItems, localItems, publicGistItems, privateGistItems])

        .spread(function (demoitems, localitems, publicgistitems, privategistitems) {
            $select.innerHTML = "";
            optgroupCommands.label = "Commands";

            optgroupDemos.label = "Demos";
            optgroupLocal.label = "Local Scripts";
            optGroupPublicGists.label = "Public Gists";
            optGroupPrivateGists.label = "Private Gists";

            $select.appendChild(optgroupCommands);
            createOption(options.commands.newlocalscript, optgroupCommands);
            createOption(options.commands.newpublicgist, optgroupCommands);
            createOption(options.commands.newprivategist, optgroupCommands);
            createOption(options.commands.sync, optgroupCommands);
            createOption(options.commands.help, optgroupCommands);
            createOption(options.commands.about, optgroupCommands);

            $select.appendChild(optgroupDemos);
            demoitems.forEach(function (ex) {
                var op = createOption(ex, optgroupDemos);
                if (ex == name) op.selected = "selected";
            });

            $select.appendChild(optgroupLocal);
            localitems.forEach(function (ex) {
                var op = createOption(ex, optgroupLocal);
                if (ex == name) op.selected = "selected";
            });

            $select.appendChild(optGroupPublicGists);
            publicgistitems.forEach(function (ex) {
                var op = createOption(ex, optGroupPublicGists);
                if (ex == name) op.selected = "selected";
            });

            $select.appendChild(optGroupPrivateGists);
            privategistitems.forEach(function (ex) {
                var op = createOption(ex, optGroupPrivateGists);
                if (ex == name) op.selected = "selected";
            });
        });
};

select.set = function (val) {
    setTimeout(function () { $select.value = val; }, 30);
};

select.isOption = function (idx) {
    return $select.options[idx] && $select.options[idx].parentNode ? true : false;
};

select.getSection = function (idx) {
    return options.sections[$select.options[idx].parentNode.label];
};

module.exports = select;

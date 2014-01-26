/*
 * runner.js - the script runner
 */

module.exports = function (Q, Zanimo, create, start, width, height) {
/*
 * damier
 */

var floor = Math.floor,
    rand = Math.random,
    n = 4,
    elements = [],
    rectangle = function (w, h) {
        return create({
            width: w + 'px',
            height: h + 'px',
            left:'0px',
            top:'0px',
            opacity:0
        });
    },
    show = Zanimo.f('opacity', 1),
    hide = Zanimo.f('opacity', 0),
    init = function (idx) {
        var x = idx % n * width/n,
            y = (height/n) * floor(idx/n);
        return Zanimo.f('transform', 'translate3d(' + x + 'px, ' + y + 'px,0px)');
    },
    hsl = function () {
        var a = floor(rand() * 300),
        b = floor(rand() * 100 + 1),
        c = floor(rand() * 100 + 1);
        return 'hsl('+ a +', '+ b +'%, '+ c +'%)';
    },
    colorize = function () {
        return Zanimo.f('background-color', hsl());
    },
    apply = function (els, f) {
        return function () {
            return els.reduce(function (prev, el) {
                return prev.then(function () { return f(el);});
            }, Q());
        }
    },
    apply2 = function (els, F) {
        return function () {
            return els.reduce(function (prev, el, idx) {
                return prev.then(function () { return F(idx)(el); });
            }, Q());
        }
    };

for (i=0 ;i<n; i++) {
    for (j=0 ;j<n; j++) {
        elements.push( rectangle(width/n, height/n));
    }
}

return start()
    .then(apply2(elements, init))
    .then(apply(elements, show))
    .then(apply2(elements, colorize))
    .then(apply2(elements, colorize))
    .delay(300);
};

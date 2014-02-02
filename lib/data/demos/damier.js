/*
 * demos/damier.js
 */

module.exports = function (Q, Zanimo, create, width, height) {/*
 * damier
 */

var n = 4,
    floor = Math.floor,
    rand = Math.random,
    elements = [],
    rectangle = function (w, h) {
        return create({
            width: w + 'px',
            height: h + 'px',
            left:'0px',
            top:'0px',
            opacity:1,
            background:'none'
        });
    },
    initialize = function (idx) {
        var x = idx % n * width/n,
            y = (height/n) * floor(idx/n);
        return Zanimo.f(
            'transform',
            'translate3d(' + x + 'px, ' + y + 'px,0px)'
        );
    },
    hsl = function () {
        var a = floor(rand() * 360),
        b = floor(rand() * 100),
        c = floor(rand() * 100);
        return 'hsl('+ a +', '+ b +'%, '+ c +'%)';
    },
    colorize = function () {
        return Zanimo.f('background', hsl());
    },
    apply = function (els, F) {
        return function () {
            return els.reduce(function (prev, el, idx) {
                return prev.then(function () {
                    return F(idx)(el);
                });
            }, Q());
        }
    },
    times = function (k, f) {
        return function () {
            if (k > 0) {
                return f().then(function () {
                    return times(k-1, f)();
                });
            }
        };
    };

for (i=0 ;i<n; i++) {
    for (j=0 ;j<n; j++) {
        elements.push(rectangle(width/n, height/n));
    }
}

return apply(elements, initialize)()
    .then(times(5, apply(elements, colorize)))
};

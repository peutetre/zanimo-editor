/*
 * runner.js - the script runner
 */

module.exports = function (Q, Zanimo, create, start, width, height) {
/*
 * damier
 */

var n = 7, // grid size
    // create grid element
    grid = create({
        width: width,
        height: height,
        left:'0px',
        top:'0px',
        opacity:0
    }, 'table'),
    // show transition
    show = Zanimo.f(
        'opacity', 1, 500
    ),
    pass = function (el) { return function () { return el; } },
    // change background color animations
    animRed = Zanimo.f('background', 'red', 50),
    animGreen = Zanimo.f('background', 'green', 50),
    // play an animation sequence
    play = function (seq, anim) { return function () {
        return seq.slice(1).reduce(function (prevStep, el) {
            return prevStep.then(pass(el)).then(anim);
        }, anim(seq[0]));
    }},
    play2 = function (seq, animf) { return function () {
        return seq.slice(1).reduce(function (prevStep, el, idx) {
            return prevStep.then(pass(el)).then(animf(idx+1));
        }, animf(0)(seq[0]));
    }},
    randomHsl = function () {
    	return 'hsl(' + Math.floor(Math.random() * 300) + ', ' + Math.floor(Math.random() * 100 + 1) + '%, '+ Math.floor(Math.random() * 100 +1) +'%)';
    },
    chgBackground = function () {
    	return Zanimo.f('background', randomHsl(), 50);
    },
    blackOrWhite = function (idx) {
    	return Zanimo.f('background', idx%2 ? 'black' : 'white', 50);
    },
    // keep reference of grid elements
    ref = [],
    // tmp elt
    tr = null;

// create grid
for (var i=0; i<n; i++) {
    tr = create({
        width: width,
        position:'static'
    }, 'tr');
    grid.appendChild(tr);
    for (var j=0; j<n; j++) {
        ref[i*n + j] = create({
            position:'static',
            width: (100/n) + '%',
            height: (100/n) + '%',
        }, 'td');
        tr.appendChild(ref[i*n + j]);
    }
}

// start animation
return Zanimo(start(grid))
    .then(show)
    .then(play2(ref, chgBackground))
	//.then(function () { return Q.all(ref.map(function (el) { return Zanimo(el, 'border-radius', '50px', 1000); })); })
	.then(function () { return Q.all(ref.map(function (el) { return Zanimo(el, 'filter', 'grayscale(1)', 1000); })); })
	.then(play2(ref, chgBackground))
    .delay(300);
};

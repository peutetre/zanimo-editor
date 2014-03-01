/*
 * demos/cat.js
 */

module.exports = function (Q, Zanimo, Qajax, Qimage, create, width, height) {/*
 * cat curve
 */
var n = 60,
    cos = Math.cos,
    sin = Math.sin,
    floor = Math.floor,
    PI = Math.PI,

    cat = function cat(t) {
        var x = - (721 * sin(t)/4)
                + (196/3) * sin(2 * t)
                -(86/3) * sin(3 * t)
                -(131/2) * sin(4 * t)
                +(477/14) * sin(5 * t)
                + 27 * sin(6 * t)
                -(29/2) * sin(7 * t)
                +(68/5) * sin(8 * t)
                +(1/10) * sin(9 * t)
                +(23/4) * sin(10 * t)
                -(19/2) * sin(12 * t)
                -(85/21) * sin(13 * t)
                +(2/3) * sin(14 * t) 
                +(27/5) * sin(15 * t)
                +(7/4) * sin(16 * t)
                +(17/9) * sin(17 * t)
                -4 * sin(18 * t)
                -(1/2) * sin(19 * t)
                +(1/6) * sin(20* t)
                +(6/7) * sin(21 * t)
                -(1/8) * sin(22 * t)
                +(1/3) * sin(23 * t)
                +(3/2) * sin(24 * t)
                +(13/5) * sin(25 * t)
                + sin(26 * t)
                -2 * sin(27* t)
                +(3/5) * sin(28 * t)
                -(1/5) * sin(29 * t)
                +(1/5) * sin(30 * t)
                +(2337 * cos (t)/8)
                -(43/5) * cos (2 * t)
                +(322/5) * cos (3* t)
                -(117/5) * cos (4 * t)
                -(26/5) * cos (5 * t)
                -(23/3) * cos (6 * t)
                +(143/4) * cos (7 * t)
                -(11/4) * cos (8 * t)
                -(31/3) * cos (9 * t)
                -(13/4) * cos (10 * t)
                -(9/2) * cos (11 * t)
                +(41/20) * cos (12 * t)
                +8 * cos (13 * t)
                +(2/3) * cos (14 * t)
                +6 * cos (15 * t)
                +(17/4) * cos(16 * t)
                -(3/2) * cos (17 * t)
                -(29/10) * cos (18 * t)
                +(11/6) * cos (19 * t)
                +(12/5) * cos (20 * t)
                +(3/2) * cos (21 * t)
                +(11/12)* cos (22 * t)
                -(4/5) * cos (23 * t)
                + cos (24 * t)
                +(17/8) * cos (25 * t)
                -(7/2) * cos (26 * t)
                -(5/6) * cos (27 * t)
                -(11/10) * cos (28 * t)
                +(1/2)* cos (29 * t)
                -(1/5) * cos (30 * t),
            y = - (637 * sin(t)/2)
                -(188/5) * sin(2 * t)
                -(11/7) * sin(3 * t)
                -(12/5) * sin(4 * t)
                +(11/3) * sin(5 * t)
                -(37/4) *sin(6 * t)
                +(8/3) * sin(7 * t)
                +(65/6) * sin(8 * t)
                -(32/5) * sin(9 * t)
                -(41/4) * sin(10 * t)
                -(38/3) * sin(11 * t)
                -(47/8) *sin(12 * t)
                +(5/4) * sin(13 * t)
                -(41/7) * sin(14 * t)
                -(7/3) * sin(15 * t)
                -(13/7) * sin(16 * t)
                +(17/4) * sin(17 * t)
                -(9/4) *sin(18 * t)
                +(8/9) * sin(19 * t)
                +(3/5) * sin(20 * t)
                -(2/5) * sin(21 * t)
                +(4/3) * sin(22 * t)
                +(1/3) * sin(23 * t)
                +(3/5) * sin(24* t)
                -(3/5) * sin(25 * t)
                +(6/5) * sin(26 * t)
                -(1/5) * sin(27 * t)
                +(10/9) * sin(28 * t)
                +(1/3) * sin(29 * t)
                -(3/4) * sin(30* t)
                -(125 * cos (t)/2)
                -(521/9) * cos (2 * t)
                -(359/3) * cos (3 * t)
                +(47/3) * cos (4 * t)
                -(33/2) * cos (5 * t)
                -(5/4) * cos (6 * t)
                +(31/8)* cos (7 * t)
                +(9/10) * cos (8 * t)
                -(119/4) * cos (9 * t)
                -(17/2) * cos (10 * t)
                +(22/3) * cos (11 * t)
                +(15/4) * cos (12 * t)
                -(5/2)* cos (13 * t)
                +(19/6) * cos (14 * t)
                +(7/4) * cos (15 * t)
                +(31/4) * cos (16 * t)
                - cos (17 * t)
                +(11/10) * cos (18 * t)
                -(2/3) * cos (19* t)
                +(13/3) * cos (20 * t)
                -(5/4) * cos (21 * t)
                +(2/3) * cos (22 * t)
                +(1/4) * cos (23 * t)
                +(5/6) * cos (24 * t)
                +(3/4) * cos (26* t)
                -(1/2) * cos (27 * t)
                -(1/10) * cos (28 * t)
                -(1/3) * cos (29 * t)
                -(1/19) * cos (30 * t);

        return [floor(x/3), -floor(y/3)];
    },

    pointConfig = {
        backgroundColor:'rgba(10,10,10,0.5)',
        width:'10px',
        height:'10px',
        borderRadius:'10px',
        top:'-webkit-calc(50% - 10px)',
        top:'calc(50% - 10px)',
        left:'-webkit-calc(50% - 10px)',
        left:'calc(50% - 10px)',
        boxShadow:'0px 1px 1px rgba(0,0,0,0.1)',
        display:'block',
        opacity:1
    },

    points = [ ],

    circle = function circle(t) {
        return [floor(400*cos(t)), - floor(400*sin(t))];
    },
    smallcircle = function circle(t) {
        return [floor(200*cos(t)), - floor(200*sin(t))];
    },
    animate = function (el, w, z) {
        return Zanimo(el,
            'transform',
            'translate3d(' + w + 'px,' + z + 'px,0px)',
            1000,
            'cubic-bezier(.03,.36,.27,1.28)'
        );
    },
    apply = function (f, pts, min, max) {
        return Q.all(pts.map(function (point, idx) {
            var pos = f((idx+1)*(max-min)/points.length);
            return animate(point, pos[0], pos[1]);
        }));
    },
    applyf = function (f, pts, min, max) {
        return function () {
            return apply(f, pts, min, max);
        };
    };

for(var i=0; i<n; i++) {
    points.push(pointConfig);
}

points = create(points);

return apply(circle, points, 0, 2 * PI)
    .then(applyf(smallcircle, points, 0, 2 * PI))
    .then(applyf(cat, points, 0, 2 * PI))
    .then(applyf(smallcircle, points, 0, 2 * PI))
    .then(applyf(cat, points, 0, 2 * Math.PI))
    .then(applyf(smallcircle, points, 0, 2 * PI))
    .then(applyf(circle, points, 0, 2 * PI))
    .then(applyf(cat, points, 0, 2 * PI))
    .then(applyf(smallcircle, points, 0, 2 * PI))
    .then(applyf(cat, points, 0, 2 * PI))
    .then(applyf(circle, points, 0, 2 * PI))
    .then(applyf(cat, points, 0, 2 * PI))
    .then(applyf(smallcircle, points, 0, 2 * PI))
    .delay(200);
};

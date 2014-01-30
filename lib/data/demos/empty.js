/*
 * demos/empty.js
 */

module.exports = function (Q, Zanimo, create, width, height) {

var cube = create({
    width:'100px',
    height:'100px',
    backgroundColor:'red',
    top: (height/2 - 50) + 'px',
    left: (width/2 - 50) + 'px',
    opacity: 0
});

return Zanimo(cube, 'opacity', 1, 1000)
    .then(Zanimo.f('background-color', 'blue', 1000, 'ease-in-out'));
};

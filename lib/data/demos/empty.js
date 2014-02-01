/*
 * demos/empty.js
 */

module.exports = function (Q, Zanimo, create, width, height) {
var cube = create({
    width:'100px',
    height:'100px',
    backgroundColor:'rgb(253, 107, 107)',
    top: (height/2 - 50) + 'px',
    left: (width/2 - 50) + 'px',
    opacity: 0
});

return Zanimo(cube, 'opacity', 1, 1000)
    .then(Zanimo.f('background-color', 'rgb(118, 189, 255)', 1000, 'ease-in-out'))
    .then(Zanimo.f('transform', 'rotate(361deg)', 1000, 'ease-in-out'));
};

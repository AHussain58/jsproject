/**
 * Et Javascript-program som tegner et rektangel på et HTML5-canvas.
 * Bruker ikke WebGL her.
 */
export function main() {
	// Oppretter html5-canvas (pakket inn i et div-element):
	let divWrapper = document.createElement('div');
	let canvasElem = document.createElement('canvas');
	document.body.appendChild(divWrapper);
	divWrapper.appendChild(canvasElem);
	divWrapper.id = 'my2DCanvas';
	canvasElem.width = 960;
	canvasElem.height = 480;

	// RenderingContext for 2D
	let gl = canvasElem.getContext('2d');
	gl.fillStyle = 'rgba(0, 255, 255, 1.0)';  //Setter farge.
	gl.fillRect(0, 0, 250, 250);   //Fylt rektangel.
}

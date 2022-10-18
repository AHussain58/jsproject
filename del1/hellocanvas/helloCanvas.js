import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
/**
 * Et WebGL-program som viser et HTML5-canvas.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	const gl = webGLCanvas.gl;
	// Klargjør canvas:
	gl.clearColor(0.9, 0.2, 0.9, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

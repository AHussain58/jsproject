import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';

/**
 * Et WebGL-program som viser et HTML5-canvas med et punkt.
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	const gl = webGLCanvas.gl;
	let baseShaderInfo = initBaseShaders(gl);
	draw(gl, baseShaderInfo);
}

function initBaseShaders(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('base-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('base-fragment-shader').innerHTML;

	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexPointSize: gl.getAttribLocation(glslShader.shaderProgram, 'aPointSize'),
		},
		uniformLocations: {
			fragmentColor: gl.getUniformLocation(glslShader.shaderProgram, 'uFragmentColor'),
		},
	};
}

function connectPositionAttribute(gl, baseShaderInfo) {
	gl.vertexAttrib3f(baseShaderInfo.attribLocations.vertexPosition, 0.0, 0.0, 0.0);
}

function connectSizeAttribute(gl, baseShaderInfo) {
	gl.vertexAttrib1f(baseShaderInfo.attribLocations.vertexPointSize, 50.0);
}

function connectColorUniform(gl, baseShaderInfo) {
	let colorRGBA = [1.0, 1.0, 0.0, 1.0];
	gl.uniform4f(baseShaderInfo.uniformLocations.fragmentColor, colorRGBA[0],colorRGBA[1],colorRGBA[2],colorRGBA[3]);
}

/**
 * Klargjør canvaset.
 * Kalles fra draw()
 */
function clearCanvas(gl) {
	gl.clearColor(0.9, 0.9, 0.9, 1);  // Clear screen farge.
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);           // Enable "depth testing".
	gl.depthFunc(gl.LEQUAL);            // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Tegner!
 */
function draw(gl, baseShaderInfo) {
	clearCanvas(gl);

	// Aktiver shader:
	gl.useProgram(baseShaderInfo.program);

	// Kople til/klargjør de ulike attributtene/parametrene:
	connectPositionAttribute(gl, baseShaderInfo);
	connectSizeAttribute(gl, baseShaderInfo);
	connectColorUniform(gl, baseShaderInfo);

	// Tegn!
	gl.drawArrays(gl.POINTS, 0, 1);
}

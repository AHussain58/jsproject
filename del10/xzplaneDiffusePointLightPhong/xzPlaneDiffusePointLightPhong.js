import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';
import {Camera} from '../../base/helpers/Camera.js';
import {vectorToString} from "../../base/lib/utility-functions.js";

/**
 * MERK: Hvilket shaderpar som brukes bestemmes av check-boksen..
 */
export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);

	const checkBox = document.getElementById("phongCheckBox");
	checkBox.addEventListener("click", (event) => {
		startProgram(webGLCanvas, checkBox.checked);
	});
	startProgram(webGLCanvas, false);
}

function startProgram(webGLCanvas, usePhong) {
	// Hjelpeobjekt som holder på objekter som trengs for rendring:
	const renderInfo = {
		gl: webGLCanvas.gl,
		baseShader: initBaseShaders(webGLCanvas.gl),
		diffuseLightShader: initDiffuseLightShader(webGLCanvas.gl, usePhong),

		coordBuffers: initCoordBuffers(webGLCanvas.gl),
		xzplaneBuffers: initXZPlaneBuffers(webGLCanvas.gl),

		currentlyPressedKeys: [],
		lastTime: 0,
		fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
			frameCount: 0,
			lastTimeStamp: 0
		},
		light: {
			lightPosition: {x: 0, y:3, z:0},
			diffuseLightColor: {r: 0.1, g: 0.8, b:0.3},
			ambientLightColor: {r: 0.2, g: 0.2, b:0.2},
		},
	};

	initKeyPress(renderInfo);
	const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
	camera.camPosX = 15;
	camera.camPosY = 40;
	camera.camPosZ = 60;

	document.getElementById('light-position').innerHTML = vectorToString(renderInfo.light.lightPosition);
	document.getElementById('diffuse-light-color').innerHTML = vectorToString(renderInfo.light.diffuseLightColor);
	document.getElementById('ambient-light').innerHTML = vectorToString(renderInfo.light.ambientLightColor);
	document.getElementById('camera').innerHTML = camera.toString();

	animate( 0, renderInfo, camera);
}

/**
 * Knytter tastatur-evnents til eventfunksjoner.
 */
function initKeyPress(renderInfo) {
	document.addEventListener('keyup', (event) => {
		renderInfo.currentlyPressedKeys[event.which] = false;
	}, false);
	document.addEventListener('keydown', (event) => {
		renderInfo.currentlyPressedKeys[event.which] = true;
	}, false);
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
			vertexColor: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
		},
	};
}

/**
 * Lysberegning  gjøres i fragmenshaderen.
 * @param gl
 * @returns {{uniformLocations: {normalMatrix: WebGLUniformLocation, lightPosition: WebGLUniformLocation, projectionMatrix: WebGLUniformLocation, diffuseLightColor: WebGLUniformLocation, modelMatrix: WebGLUniformLocation, ambientLightColor: WebGLUniformLocation, modelViewMatrix: WebGLUniformLocation}, attribLocations: {vertexNormal: GLint, vertexPosition: GLint}, program: (null|*)}}
 */
function initDiffuseLightShader(gl, usePhongShading=false) {

	if (usePhongShading)
		document.getElementById('gourad-phong').innerHTML = 'PHONG';
	else
		document.getElementById('gourad-phong').innerHTML = 'GOURAD';

	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = undefined;
	let fragmentShaderSource = undefined;
	if (usePhongShading) {
		vertexShaderSource = document.getElementById('diffuse-pointlight-phong-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('diffuse-pointlight-phong-fragment-shader').innerHTML;
	} else {
		vertexShaderSource = document.getElementById('diffuse-pointlight-gourad-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('diffuse-pointlight-gourad-fragment-shader').innerHTML;
	}
	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

	// Samler all shader-info i ET JS-objekt, som returneres.
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
			vertexNormal: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexNormal'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
			modelMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelMatrix'),
			normalMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uNormalMatrix'),

			lightPosition: gl.getUniformLocation(glslShader.shaderProgram, 'uLightPosition'),
			ambientLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uAmbientLightColor'),
			diffuseLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uDiffuseLightColor'),
		},
	};
}

function initCoordBuffers(gl) {
	const extent =  100;

	const positions = new Float32Array([
		-extent, 0, 0,
		extent, 0, 0,
		0, -extent, 0,
		0, extent, 0,
		0, 0, -extent,
		0, 0, extent
	]);

	const colors = new Float32Array([
		1,0,0,1,   //R G B A
		1,0,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,1,0,1,   //R G B A
		0,0,1,1,   //R G B A
		0,0,1,1,   //R G B A
	]);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		color: colorBuffer,
		vertexCount: positions.length/3
	};
}

function initXZPlaneBuffers(gl) {
	const XZPLANE_SIZE=100;
	let positions = [
		-XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		-XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
		-XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, XZPLANE_SIZE/2,
		XZPLANE_SIZE/2, 0, -XZPLANE_SIZE/2,
	];
	let normals = [
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
	];

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return  {
		position: positionBuffer,
		normal: normalBuffer,
		vertexCount: positions.length/3,
	};
}

function connectPositionAttribute(gl, shader, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
}

function connectColorAttribute(gl, shader, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexColor);
}

function connectNormalAttribute(gl, shader, normalBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(
		shader.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
}

function connectAmbientUniform(gl, shader, color) {
	gl.uniform3f(shader.uniformLocations.ambientLightColor, color.r,color.g,color.b);
}

function connectDiffuseUniform(gl, shader,color) {
	gl.uniform3f(shader.uniformLocations.diffuseLightColor, color.r,color.g,color.b);
}

function connectLightPositionUniform(gl, shader, position) {
	gl.uniform3f(shader.uniformLocations.lightPosition, position.x,position.y,position.z);
}

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);
	camera.handleKeys(elapsed);

	document.getElementById('camera').innerHTML = camera.toString();

	draw(currentTime, renderInfo, camera);
}

/**
 * Beregner forløpt tid siden siste kall.
 * @param currentTime
 * @param renderInfo
 */
function getElapsed(currentTime, renderInfo) {
	let elapsed = 0.0;
	if (renderInfo.lastTime !== 0.0)	// Først gang er lastTime = 0.0.
		elapsed = (currentTime - renderInfo.lastTime)/1000; // Deler på 1000 for å operere med sekunder.
	renderInfo.lastTime = currentTime;						// Setter lastTime til currentTime.
	return elapsed;
}

/**
 * Beregner og viser FPS.
 * @param currentTime
 * @param renderInfo
 */
function calculateFps(currentTime, fpsInfo) {
	if (!currentTime) currentTime = 0;
	// Sjekker om  ET sekund har forløpt...
	if (currentTime - fpsInfo.lastTimeStamp >= 1000) {
		// Viser FPS i .html ("fps" er definert i .html fila):
		document.getElementById('fps').innerHTML = fpsInfo.frameCount;
		// Nullstiller fps-teller:
		fpsInfo.frameCount = 0;
		//Brukes for å finne ut om det har gått 1 sekund - i så fall beregnes FPS på nytt.
		fpsInfo.lastTimeStamp = currentTime;
	}
	// Øker antall frames per sekund:
	fpsInfo.frameCount++;
}

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
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);
	drawCoord(renderInfo, camera);
	drawXZPlane(renderInfo, camera);
}

function drawCoord(renderInfo, camera) {
	renderInfo.gl.useProgram(renderInfo.baseShader.program);
	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShader, renderInfo.coordBuffers.color);

	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	// Tegn coord:
	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.coordBuffers.vertexCount);
}

function drawXZPlane(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.diffuseLightShader.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.xzplaneBuffers.position);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.xzplaneBuffers.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.ambientLightColor);
	connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.diffuseLightColor);
	connectLightPositionUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.lightPosition);

	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,0);
	modelMatrix.scale(0.5,0.5, 0.5);

	// Send MODELLmatrisa til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightShader.uniformLocations.modelMatrix, false, modelMatrix.elements);

	// Send moelView og kameramatrisene til shaderen:
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	// Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js
	// Send normalmatrisa til shaderen (merk: 3x3):
	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightShader.uniformLocations.normalMatrix, false, normalMatrix);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.xzplaneBuffers.vertexCount);
}

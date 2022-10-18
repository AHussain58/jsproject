import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';
import {Camera} from '../../base/helpers/Camera.js';
import {ImageLoader} from '../../base/helpers/ImageLoader.js';
import {isPowerOfTwo1, vectorToString} from '../../base/lib/utility-functions.js';

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	// Hjelpeobjekt som holder på objekter som trengs for rendring:
	const renderInfo = {
		gl: webGLCanvas.gl,
		baseShader: initBaseShaders(webGLCanvas.gl),
		diffuseLightShader: initDiffuseLightShader(webGLCanvas.gl),

		coordBuffers: initCoordBuffers(webGLCanvas.gl),
		sphereBuffers: initSphereBuffers(webGLCanvas.gl),

		currentlyPressedKeys: [],
		lastTime: 0,
		fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
			frameCount: 0,
			lastTimeStamp: 0
		},
		light: {
			lightDirection: {x: -10, y:6, z:10},
			diffuseLightColor: {r: 0.1, g: 0.8, b:0.3},
			ambientLightColor: {r: 0.2, g: 0.2, b:0.2},
		},
	};

	initKeyPress(renderInfo);
	const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
	camera.camPosX = 2.5;
	camera.camPosY = 6;
	camera.camPosZ = 10;

	document.getElementById('light-direction').innerHTML = vectorToString(renderInfo.light.lightDirection);
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

function initDiffuseLightShader(gl) {
	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = document.getElementById('diffuse-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('diffuse-fragment-shader').innerHTML;

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
			normalMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uNormalMatrix'),

			lightDirection: gl.getUniformLocation(glslShader.shaderProgram, 'uLightDirection'),
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

// Returnerer normalisert normalvektor for kuleverteks:
function calculateSphereNormalForVertex(x, y, z) {
	let normal = vec3.fromValues(x,y,z);
	let normalisertNormal = vec3.create();
	vec3.normalize(normalisertNormal, normal);
	return normalisertNormal;
}

function initSphereBuffers(gl) {
	let positions = [];
	let normals = [];
	let indices = [];

	// Basert på kode fra: http://learningwebgl.com/blog/?p=1253
	let radius = 5;
	let latitudeBands = 30;     //latitude: parallellt med ekvator.
	let longitudeBands = 30;    //longitude: går fra nord- til sydpolen.

	//Genererer vertekser:
	for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
		let theta = latNumber * Math.PI / latitudeBands;
		let sinTheta = Math.sin(theta);
		let cosTheta = Math.cos(theta);

		for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
			let phi = longNumber * 2 * Math.PI / longitudeBands;
			let sinPhi = Math.sin(phi);
			let cosPhi = Math.cos(phi);

			let x = cosPhi * sinTheta;
			let y = cosTheta;
			let z = sinPhi * sinTheta;

			positions.push(radius * x);
			positions.push(radius * y);
			positions.push(radius * z);

			let normal = calculateSphereNormalForVertex(x, y, z);
			normals.push(normal[0]);
			normals.push(normal[1]);
			normals.push(normal[2]);
		}
	}

	//Genererer indeksdata for å knytte sammen verteksene:
	for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
		for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
			let first = (latNumber * (longitudeBands + 1)) + longNumber;
			let second = first + longitudeBands + 1;
			indices.push(first);
			indices.push(second);
			indices.push(first + 1);

			indices.push(second);
			indices.push(second + 1);
			indices.push(first + 1);
		}
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//Indeksbuffer: oppretter, binder og skriver data til bufret:
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return  {
		position: positionBuffer,
		normal: normalBuffer,
		index: indexBuffer,
		vertexCount: positions.length/3,
		indexCount: indices.length
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
	gl.uniform3f(shader.uniformLocations.ambientLightColor, color.r, color.g, color.b);
}

function connectDiffuseUniform(gl, shader, color) {
	gl.uniform3f(shader.uniformLocations.diffuseLightColor, color.r, color.g, color.b);
}

function connectLightDirectionUniform(gl, shader, direction) {
	gl.uniform3f(shader.uniformLocations.lightDirection, direction.x, direction.y, direction.z);
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
	drawSphere(renderInfo, camera);
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

function drawSphere(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.diffuseLightShader.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.sphereBuffers.position);
	connectNormalAttribute(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.sphereBuffers.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.ambientLightColor);
	connectDiffuseUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.diffuseLightColor);
	connectLightDirectionUniform(renderInfo.gl, renderInfo.diffuseLightShader, renderInfo.light.lightDirection);

	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,0);
	modelMatrix.scale(0.5,0.5, 0.5);
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.diffuseLightShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	//Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js

	renderInfo.gl.uniformMatrix3fv(renderInfo.diffuseLightShader.uniformLocations.normalMatrix, false, normalMatrix);
	renderInfo.gl.drawElements(renderInfo.gl.TRIANGLES, renderInfo.sphereBuffers.indexCount, renderInfo.gl.UNSIGNED_SHORT, 0);
}

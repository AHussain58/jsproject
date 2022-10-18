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

	let usePhongShading = false;
	checkBox.checked = usePhongShading;
	startProgram(webGLCanvas, usePhongShading);
}

function startProgram(webGLCanvas, usePhong) {

	const shininessSelector = document.getElementById("shininess");
	shininessSelector.addEventListener("click", (event) => {
		renderInfo.light.shininess = shininessSelector.value;
	})

	const intensitySelector = document.getElementById("intensity");
	intensitySelector.addEventListener("click", (event) => {
		renderInfo.light.intensity = intensitySelector.value;
	})

	// Hjelpeobjekt som holder på objekter som trengs for rendring:
	const renderInfo = {
		gl: webGLCanvas.gl,
		baseShader: initBaseShaders(webGLCanvas.gl),
		specularLightShader: initSpecularLightShader(webGLCanvas.gl, usePhong),
		lightSourceShader: initLightSourceShader(webGLCanvas.gl),

		coordBuffers: initCoordBuffers(webGLCanvas.gl),
		cubeBuffers: initCubeBuffers(webGLCanvas.gl),
		lightSourceBuffers: initLightSourceBuffers(webGLCanvas.gl),

		currentlyPressedKeys: [],
		lastTime: 0,
		fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
			frameCount: 0,
			lastTimeStamp: 0
		},
		light: {
			lightPosition: {x:0, y:0, z:5},
			ambientLightColor: {r: 0.0, g: 0.0, b:0.0, a:1},
			specularLightColor: {r: 0.1, g: 0.8, b:0.3, a:1},
			shininess: 78.8,
			intensity: 1
		},
		animation: {    //Holder på animasjonsinfo:
			angle: 0,
			rotationsSpeed: 60
		}
	};

	shininessSelector.value = renderInfo.light.shininess;
	intensitySelector.value = renderInfo.light.intensity;

	initKeyPress(renderInfo);
	const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
	camera.camPosX = 1.6;
	camera.camPosY = 1.3;
	camera.camPosZ = 9.6;

	document.getElementById('light-position').innerHTML = vectorToString(renderInfo.light.lightPosition);
	document.getElementById('specular-light-color').innerHTML = vectorToString(renderInfo.light.specularLightColor);
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
 * @returns {{uniformLocations: {normalMatrix: WebGLUniformLocation, lightPosition: WebGLUniformLocation, projectionMatrix: WebGLUniformLocation, specularLightColor: WebGLUniformLocation, modelMatrix: WebGLUniformLocation, ambientLightColor: WebGLUniformLocation, modelViewMatrix: WebGLUniformLocation}, attribLocations: {vertexNormal: GLint, vertexPosition: GLint}, program: (null|*)}}
 */
function initSpecularLightShader(gl, usePhongShading=false) {
	if (usePhongShading)
		document.getElementById('gourad-phong').innerHTML = 'PHONG';
	else
		document.getElementById('gourad-phong').innerHTML = 'GOURAD';

	// Leser shaderkode fra HTML-fila: Standard/enkel shader (posisjon og farge):
	let vertexShaderSource = undefined;
	let fragmentShaderSource = undefined;
	if (usePhongShading) {
		vertexShaderSource = document.getElementById('specular-phong-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('specular-phong-fragment-shader').innerHTML;
	} else {
		vertexShaderSource = document.getElementById('specular-gourad-vertex-shader').innerHTML;
		fragmentShaderSource = document.getElementById('specular-gourad-fragment-shader').innerHTML;
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
			cameraPosition: gl.getUniformLocation(glslShader.shaderProgram, 'uCameraPosition'),
			ambientLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uAmbientLightColor'),
			specularLightColor: gl.getUniformLocation(glslShader.shaderProgram, 'uSpecularLightColor'),

			shininess: gl.getUniformLocation(glslShader.shaderProgram, 'uShininess'),
			intensity: gl.getUniformLocation(glslShader.shaderProgram, 'uIntensity'),
		},
	};
}

function initLightSourceShader(gl) {
	let vertexShaderSource = document.getElementById('light-source-vertex-shader').innerHTML;
	let fragmentShaderSource = document.getElementById('light-source-fragment-shader').innerHTML;
	// Initialiserer  & kompilerer shader-programmene;
	const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);
	return  {
		program: glslShader.shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, 'aVertexPosition'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(glslShader.shaderProgram, 'uModelViewMatrix'),
			fragColor: gl.getUniformLocation(glslShader.shaderProgram, 'uFragColor'),
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

function cubePositions() {
	return [
		//Forsiden (pos):
		-1, 1, 1,
		-1, -1, 1,
		1, -1, 1,

		-1, 1, 1,
		1, -1, 1,
		1, 1, 1,

		//H�yre side:
		1, 1, 1,
		1, -1, 1,
		1, -1, -1,

		1, 1, 1,
		1, -1, -1,
		1, 1, -1,

		//Baksiden:
		1, -1, -1,
		-1, -1, -1,
		1, 1, -1,

		-1, -1, -1,
		-1, 1, -1,
		1, 1, -1,

		//Venstre side:
		-1, -1, -1,
		-1, 1, 1,
		-1, 1, -1,

		-1, -1, 1,
		-1, 1, 1,
		-1, -1, -1,

		//Topp:
		-1, 1, 1,
		1, 1, 1,
		-1, 1, -1,

		-1, 1, -1,
		1, 1, 1,
		1, 1, -1,

		//Bunn:
		-1, -1, -1,
		1, -1, 1,
		-1, -1, 1,

		-1, -1, -1,
		1, -1, -1,
		1, -1, 1
	]
}

function cubeNormals() {
	return [
		//Forsiden:
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		//H�yre side:
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		//Baksiden:
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		//Venstre side:
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,

		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,

		//Topp
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		//Bunn:
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0
	];

}

function initLightSourceBuffers(gl) {
	let positions = cubePositions();
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return  {
		position: positionBuffer,
		vertexCount: positions.length/3,
	};
}


function initCubeBuffers(gl) {
	let positions = cubePositions();
	let normals = cubeNormals();

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
	gl.uniform4f(shader.uniformLocations.ambientLightColor, color.r,color.g,color.b,color.a);
}

function connectSpecularUniform(gl, shader,color) {
	gl.uniform4f(shader.uniformLocations.specularLightColor, color.r,color.g,color.b,color.a);
}

function connectLightPositionUniform(gl, shader, position) {
	gl.uniform3f(shader.uniformLocations.lightPosition, position.x,position.y,position.z);
}

function connectCameraPositionUniform(gl, shader, camera) {
	gl.uniform3f(shader.uniformLocations.cameraPosition, camera.camPosX, camera.camPosY, camera.camPosZ);
}

function connectFragColorUniform(gl, shader, color) {
	gl.uniform3f(shader.uniformLocations.fragColor, color.r,color.g,color.b);
}

function connectShininessUniform(gl, shader, value) {
	gl.uniform1f(shader.uniformLocations.shininess, value);
}

function connectIntensityUniform(gl, shader, value) {
	gl.uniform1f(shader.uniformLocations.intensity, value);
}

/**
 * Håndterer brukerinput.
 */
function handleKeys(renderInfo) {
	if (renderInfo.currentlyPressedKeys[70])
		renderInfo.animation.angle += 1;    //F

	if (renderInfo.currentlyPressedKeys[71])
		renderInfo.animation.angle -= 1;    //G

	renderInfo.animation.angle %= 360;

	// LYSKILDENS POSISJON:
	// x-pos:
	if (renderInfo.currentlyPressedKeys[89]) {     //Y
		renderInfo.light.lightPosition.x -= 0.2;
	}
	if (renderInfo.currentlyPressedKeys[85]) {	    //U
		renderInfo.light.lightPosition.x += 0.2;
	}
	//y-pos
	if (renderInfo.currentlyPressedKeys[72]) {    //H
		renderInfo.light.lightPosition.y += 0.2;
	}
	if (renderInfo.currentlyPressedKeys[74]) {	//J
		renderInfo.light.lightPosition.y -= 0.2;
	}
	//z-pos
	if (renderInfo.currentlyPressedKeys[78]) {    //N
		renderInfo.light.lightPosition.z += 0.2;
	}
	if (renderInfo.currentlyPressedKeys[77]) {	//M
		renderInfo.light.lightPosition.z -= 0.2;
	}

}

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);
	camera.handleKeys(elapsed);

	handleKeys(renderInfo);

	document.getElementById('camera').innerHTML = camera.toString();

	document.getElementById('light-position').innerHTML = vectorToString(renderInfo.light.lightPosition);

	// For kontinuerlig rotasjon:
	//renderInfo.animation.angle = renderInfo.animation.angle + (renderInfo.animation.rotationsSpeed * elapsed);
	//renderInfo.animation.angle %= 360; // "Rull rundt" dersom angle >= 360 grader.
	//renderInfo.animation.lastTime = currentTime; // Setter lastTime til currentTime.

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
	drawLightSource(renderInfo, camera);
	drawCube(renderInfo, camera);
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

function drawCube(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.specularLightShader.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.specularLightShader, renderInfo.cubeBuffers.position);
	connectNormalAttribute(renderInfo.gl, renderInfo.specularLightShader, renderInfo.cubeBuffers.normal);

	connectAmbientUniform(renderInfo.gl, renderInfo.specularLightShader, renderInfo.light.ambientLightColor);
	connectSpecularUniform(renderInfo.gl, renderInfo.specularLightShader, renderInfo.light.specularLightColor);
	connectLightPositionUniform(renderInfo.gl, renderInfo.specularLightShader, renderInfo.light.lightPosition);
	connectCameraPositionUniform(renderInfo.gl, renderInfo.specularLightShader, camera);

	connectShininessUniform(renderInfo.gl, renderInfo.specularLightShader, renderInfo.light.shininess);
	connectIntensityUniform(renderInfo.gl, renderInfo.specularLightShader, renderInfo.light.intensity);

	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(0,0,0);
	modelMatrix.rotate(renderInfo.animation.angle, 0, 1, 0);
	modelMatrix.scale(0.5,0.5, 0.5);
	//Sender også inn modellmatrisa:
	renderInfo.gl.uniformMatrix4fv(renderInfo.specularLightShader.uniformLocations.modelMatrix, false, modelMatrix.elements);

	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.specularLightShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.specularLightShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	//Beregner og sender inn matrisa som brukes til å transformere normalvektorene:
	let normalMatrix = mat3.create();
	mat3.normalFromMat4(normalMatrix, modelMatrix.elements);  //NB!!! mat3.normalFromMat4! SE: gl-matrix.js
	renderInfo.gl.uniformMatrix3fv(renderInfo.specularLightShader.uniformLocations.normalMatrix, false, normalMatrix);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.cubeBuffers.vertexCount);
}

function  drawLightSource(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.lightSourceShader.program);
	connectPositionAttribute(renderInfo.gl, renderInfo.lightSourceShader, renderInfo.lightSourceBuffers.position);
	connectFragColorUniform(renderInfo.gl, renderInfo.lightSourceShader, {r:1, b:0, g:1, a:1});
	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	modelMatrix.translate(renderInfo.light.lightPosition.x,renderInfo.light.lightPosition.y,renderInfo.light.lightPosition.z);
	modelMatrix.scale(0.1,0.1, 0.1);
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.lightSourceShader.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.lightSourceShader.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, renderInfo.lightSourceBuffers.vertexCount);
}

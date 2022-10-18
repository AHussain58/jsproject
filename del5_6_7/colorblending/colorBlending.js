import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';
import {Camera} from "../../base/helpers/Camera.js";

/**
 * Demonstrerer alpha-blending.
 */

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	// Hjelpeobjekt som holder på objekter som trengs for rendring:
	const renderInfo = {
		gl: webGLCanvas.gl,
		baseShaderInfo: initBaseShaders(webGLCanvas.gl),
		coordBuffers: initCoordBuffers(webGLCanvas.gl),

		transparentRectangleBuffers: initTransparentRectangleBuffers(webGLCanvas.gl),
		opaqueRectangleBuffers: initOpaqueRectangleBuffers(webGLCanvas.gl),
		opaqueTriangleBuffers: initOpaqueTriangleBuffers(webGLCanvas.gl),

		currentlyPressedKeys: [],
		lastTime: 0,
		fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
			frameCount: 0,
			lastTimeStamp: 0
		},
	};

	initKeyPress(renderInfo.currentlyPressedKeys);
	const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
	camera.camPosX = -5;
	camera.camPosY = 4;
	camera.camPosZ = 15;
	animate( 0, renderInfo, camera);
}

/**
 * Knytter tastatur-evnents til eventfunksjoner.
 */
function initKeyPress(currentlyPressedKeys) {
	document.addEventListener('keyup', (event) => {
		currentlyPressedKeys[event.which] = false;
	}, false);
	document.addEventListener('keydown', (event) => {
		currentlyPressedKeys[event.which] = true;
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
 * Oppretter verteksbuffer for koordinatsystemet.
 * 6 vertekser, 2 for hver akse.
 * Tegnes vha. gl.LINES
 * Et posisjonsbuffer og et fargebuffer.
 * MERK: Må være likt antall posisjoner og farger.
 */
function initCoordBuffers(gl) {
	const extent =  100;

	const positions = new Float32Array([
		-extent, 0, 0,
		extent, 0, 0,
		0, -extent, 0,
		0, extent, 0,
		0, 0, -extent,
		0, 0, extent,
	]);

	const colors = new Float32Array([
		1, 0, 0, 1,   //R G B A
		1, 0, 0, 1,   //R G B A
		0, 1, 0, 1,   //R G B A
		0, 1, 0, 1,   //R G B A
		0, 0, 1, 1,   //R G B A
		0, 0, 1, 1,   //R G B A
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

/**
 * Oppretter verteksbuffer for trekanten.
 * Et posisjonsbuffer og et fargebuffer.
 * MERK: Må være likt antall posisjoner og farger.
 */
function initTransparentRectangleBuffers(gl) {
	const positions = new Float32Array([
		-1,1,0,
		-1,-1,0,
		1,-1,0,
		1,-1,0,
		1,1,0,
		-1,1,0,
	]);

	const colors = new Float32Array([
		0, 0.0, 1, 0.7,
		0, 0.0, 1, 0.7,
		0, 0.0, 1, 0.7,
		0, 0.0, 1, 0.7,
		0, 0.0, 1, 0.7,
		0, 0.0, 1, 0.7,
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
		colorValues: colors,
		vertexCount: positions.length/3
	};
}

function initOpaqueRectangleBuffers(gl) {
	const positions = new Float32Array([
		-1,1,0,
		-1,-1,0,
		1,-1,0,
		1,-1,0,
		1,1,0,
		-1,1,0,
	]);

	const colors = new Float32Array([
		0, 0.0, 1, 1,
		0, 0.0, 1, 1,
		0, 0.0, 1, 1,
		0, 0.0, 1, 1,
		0, 0.0, 1, 1,
		0, 0.0, 1, 1,
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

function initOpaqueTriangleBuffers(gl) {
	const width =  5;
	const height =  5;

	const positions = new Float32Array([
		0.0,        height/2,   0.0,    // X Y Z
		-width/2,   -height/2,  0.0,    // X Y Z
		width/2,    -height/2,  0.0     // X Y Z
	]);

	const colors = new Float32Array([
		/*
		0.3, 0.0, 0.7, 0.58,
		0.3, 0.0, 0.7, 0.58,
		0.3, 0.0, 0.7, 0.58,*/
		0.3, 0.0, 0.7, 1,
		0.3, 0.0, 0.7, 1,
		0.3, 0.0, 0.7, 1
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


/**
 * Aktiverer position-bufferet.
 * Kalles fra draw()
 */
function connectPositionAttribute(gl, baseShaderInfo, positionBuffer) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexPosition);
}

/**
 * Aktiverer color-bufferet.
 * Kalles fra draw()
 */
function connectColorAttribute(gl, baseShaderInfo, colorBuffer) {
	const numComponents = 4;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(
		baseShaderInfo.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset);
	gl.enableVertexAttribArray(baseShaderInfo.attribLocations.vertexColor);
}

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);

	camera.handleKeys(elapsed);

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

function drawCoord(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coordBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.coordBuffers.color);

	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	// Tegn coord:
	renderInfo.gl.drawArrays(renderInfo.gl.LINES, 0, renderInfo.coordBuffers.vertexCount);
}

/**
 * Klargjør canvaset.
 * Kalles fra draw()
 */
function clearCanvas(gl) {
	gl.clearColor(0.7, 0.7, 0.7, 1);
	//gl.clearColor(0, 0, 0, 0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);  // Nære objekter dekker fjerne objekter.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Tegner!
 *
 * FRA: https://www.shapediver.com/blog/solving-a-common-webgl-issue-transparency-fixed
 * Usually, a solution would be to first render all opaque objects and let them write to the depth buffer.
 * Afterwards, all transparent objects are rendered from the back to the front without writing to the depth
 * buffer anymore, but still testing against it. This ensures that transparent objects are occluded by
 * opaque objects but not by each other.
 *
 * Although this solution works in most cases, especially when intersecting transparent objects,
 * some issues can still occur in complex situations.
 *      https://www.shapediver.com/blog/solving-a-common-webgl-issue-transparency-fixed
 *
 * MERK: renderInfo.gl.depthMask(false / true);
 *      Denne bestemmer om z-bufferet skal oppdateres eller ikke.
 */
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);
	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	//** SLÅR PÅ BLENDING:
	renderInfo.gl.enable(renderInfo.gl.BLEND);
	renderInfo.gl.blendEquation(renderInfo.gl.FUNC_ADD);    //FUNC_ADD, FUNC_SUBTRACT,
	renderInfo.gl.blendFunc(renderInfo.gl.SRC_ALPHA, renderInfo.gl.ONE_MINUS_SRC_ALPHA);

	//** TEGN ALLE UGJENNOMSIKTIGE OBJEKTER FØRST (vilkårlig rekkefølge):
	//** Slår PÅ depthMask:
	renderInfo.gl.depthMask(true);
	//**Koord:
	drawCoord(renderInfo, camera);
	//**Triangle-1:
	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.translate(0, 0, 6);
	drawTriangle(renderInfo, camera, modelMatrix);
	//**Triangle-2:
	modelMatrix.setIdentity();
	modelMatrix.translate(0, 0, -6);
	drawTriangle(renderInfo, camera, modelMatrix);
	//**Rektangel-1
	modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.translate(-1, 0, 1.5);
	drawOpaqueRectangle(renderInfo, camera, modelMatrix);

	//** TEGN ALLE GJENNOMSIKTIGE OBJEKTER, I REKKEFØLGE (bakerst først):
	//** Slår AV depthMask (endrer dermed ikke z/depth buffer):
	renderInfo.gl.depthMask(false);
	//**Rektangel-2:
	modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.translate(0, 0, -2);
	drawTransparentRectangle(renderInfo, camera, modelMatrix, {red:1.0, green:0.15, blue:0.5, alpha:0.7});
	//**Rektangel-3:
	modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.translate(1, 0, -1);
	drawTransparentRectangle(renderInfo, camera, modelMatrix, {red:0.0, green:0.55, blue:0.5, alpha:0.6});
	//**Rektangel-4:
	modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	modelMatrix.translate(-1, 0, 4);
	drawTransparentRectangle(renderInfo, camera, modelMatrix, {red:0.8, green:0.55, blue:0.1, alpha:0.6});
}

function drawTransparentRectangle(renderInfo, camera, modelMatrix, color) {
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.transparentRectangleBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.transparentRectangleBuffers.color);

	setRectangleColor(renderInfo.gl, renderInfo.transparentRectangleBuffers, color);

	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, 6);
}

function drawOpaqueRectangle(renderInfo, camera, modelMatrix) {
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.opaqueRectangleBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.opaqueRectangleBuffers.color);

	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, 6);
}

function setRectangleColor(gl, transparentRectangleBuffers, color) {
	let colorValues = transparentRectangleBuffers.colorValues;
	for (let i=0; i < colorValues.length; i+=4) {
		colorValues[i] = color.red;
		colorValues[i+1] = color.green;
		colorValues[i+2] = color.blue;
		colorValues[i+3] = color.alpha;
	}
	const newColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorValues), gl.STATIC_DRAW);
	transparentRectangleBuffers.color = newColorBuffer;
}

function drawTriangle(renderInfo, camera, modelMatrix) {
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.opaqueTriangleBuffers.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.opaqueTriangleBuffers.color);

	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	renderInfo.gl.uniformMatrix4fv(renderInfo.baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);

	renderInfo.gl.drawArrays(renderInfo.gl.TRIANGLES, 0, 3);
}

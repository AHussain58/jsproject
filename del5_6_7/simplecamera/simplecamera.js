import {WebGLCanvas} from '../../base/helpers/WebGLCanvas.js';
import {WebGLShader} from '../../base/helpers/WebGLShader.js';
import {Camera} from "../../base/helpers/Camera.js";

/**
 * Et WebGL-program som tegner en enkel trekant.
 * Bruker en egen Camera-klasse som håndterer view, viewmodel og
 * projection-matrisene.
 */

export function main() {
	// Oppretter et webGLCanvas for WebGL-tegning:
	const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
	// Hjelpeobjekt som holder på objekter som trengs for rendring:
	const renderInfo = {
		gl: webGLCanvas.gl,
		baseShaderInfo: initBaseShaders(webGLCanvas.gl),
		coordBuffers: initCoordBuffers(webGLCanvas.gl),
		planetsBuffer: initPlanetBuffers(webGLCanvas.gl),
		currentlyPressedKeys: [],
		lastTime: 0,
		planetsAnimation: {     //Hjelpeobjekt som holder på animasjonsinfo:
			earthRotationAngle: 0,
			earthRotationsSpeed: 60,
			moonRotationAngle:0,
			moonOrbitAngle: 0,
			moonTranslation: 10,
			moonRotationsSpeed: 300,
			moonOrbitSpeed: 10,
			lastTime: 0
		},
		fpsInfo: {  // Brukes til å beregne og vise FPS (Frames Per Seconds):
			frameCount: 0,
			lastTimeStamp: 0
		}
	};

	initKeyPress(renderInfo.currentlyPressedKeys);
	const camera = new Camera(renderInfo.gl, renderInfo.currentlyPressedKeys);
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
		0, 0, extent
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
function initPlanetBuffers(gl) {
	const width =  5;
	const height =  5;

	const positions = new Float32Array([
		0.0,        height/2,   0.0,    // X Y Z
		-width/2,   -height/2,  0.0,    // X Y Z
		width/2,    -height/2,  0.0     // X Y Z
	]);

	const colors = new Float32Array([
		1, 0.3, 0, 1,   //R G B A
		1, 0.3, 0, 1,   //R G B A
		1, 0.3, 0, 1,   //R G B A
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

function animate(currentTime, renderInfo, camera) {
	window.requestAnimationFrame((currentTime) => {
		animate(currentTime, renderInfo, camera);
	});

	// Finner tid siden siste kall på draw().
	let elapsed = getElapsed(currentTime, renderInfo);
	calculateFps(currentTime, renderInfo.fpsInfo);

	renderInfo.planetsAnimation.earthRotationAngle += (renderInfo.planetsAnimation.earthRotationsSpeed * elapsed);
	renderInfo.planetsAnimation.earthRotationAngle %= 360;

	renderInfo.planetsAnimation.moonRotationAngle += (renderInfo.planetsAnimation.moonRotationsSpeed * elapsed);
	renderInfo.planetsAnimation.moonRotationAngle %= 360;

	renderInfo.planetsAnimation.moonOrbitAngle += (renderInfo.planetsAnimation.moonOrbitSpeed * elapsed);
	renderInfo.planetsAnimation.moonOrbitAngle %= 360;

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

/**
 * Tegner!
 */
function draw(currentTime, renderInfo, camera) {
	clearCanvas(renderInfo.gl);
	// Tegn koordinatsystemet:
	drawCoord(renderInfo, camera);
	// Tegner planetene:
	drawSolarSystem(renderInfo, camera);
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

function drawSolarSystem(renderInfo, camera) {
	// Aktiver shader:
	renderInfo.gl.useProgram(renderInfo.baseShaderInfo.program);

	// Kople posisjon og farge-attributtene til tilhørende buffer:
	connectPositionAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.planetsBuffer.position);
	connectColorAttribute(renderInfo.gl, renderInfo.baseShaderInfo, renderInfo.planetsBuffer.color);

	drawEarth(renderInfo.gl, camera, renderInfo.baseShaderInfo, renderInfo.planetsBuffer, renderInfo.planetsAnimation);
	drawMoon(renderInfo.gl, camera, renderInfo.baseShaderInfo, renderInfo.planetsBuffer, renderInfo.planetsAnimation);
}

function drawEarth(gl, camera, baseShaderInfo, planetsBuffer, planetsAnimation) {
	let modelMatrix = new Matrix4();
	//M=I*T*O*R*S, der O=R*T
	modelMatrix.setIdentity();
	//Roter kun om egen y-akse:
	modelMatrix.rotate(planetsAnimation.earthRotationAngle, 0, 1, 0);
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	// Send kameramatrisene til shaderen:
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	// Tegn jorda:
	gl.drawArrays(gl.TRIANGLES, 0, planetsBuffer.vertexCount);

}

function drawMoon(gl, camera, baseShaderInfo, planetsBuffer, planetsAnimation) {
	let modelMatrix = new Matrix4();
	modelMatrix.setIdentity();
	//Baneberegning / Orbit:
	modelMatrix.rotate(planetsAnimation.moonOrbitAngle, 0, 1, 0);      //Går i "bane" om y-aksen.
	modelMatrix.translate(0, 0, planetsAnimation.moonTranslation);	   //Flytt langs z-aksen.
	//Roter først om egen y-akse:
	modelMatrix.rotate(planetsAnimation.moonRotationAngle, 0, 1, 0); 	//Roterer om origo. Y-aksen.
	//Skalerer likt i alle akser:
	modelMatrix.scale(0.5, 0.5, 0.5);
	// Send kameramatrisene til shaderen:
	camera.set();
	let modelviewMatrix = new Matrix4(camera.viewMatrix.multiply(modelMatrix)); // NB! rekkefølge!
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.modelViewMatrix, false, modelviewMatrix.elements);
	gl.uniformMatrix4fv(baseShaderInfo.uniformLocations.projectionMatrix, false, camera.projectionMatrix.elements);
	// Tegn månen:
	gl.drawArrays(gl.TRIANGLES, 0, planetsBuffer.vertexCount);
}

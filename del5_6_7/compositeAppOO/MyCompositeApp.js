import {BaseApp} from '../../base/BaseApp.js';
import {CompositeCompositeFigure} from './CompositeCompositeFigure.js';
import {XZPlane} from "../../base/shapes/XZPlane.js";

/**
 * Klassen representerer en WebGL-app som tegner en sammensatt fiigur.
 */
export class MyCompositeApp extends BaseApp {

	constructor() {
		super();
		this.compositeCompositeFigure = new CompositeCompositeFigure(this);

		this.xzplane = new XZPlane(this);
		this.xzplane.initBuffers();
	}

	/**
	 * Håndterer brukerinput.
	 */
	handleKeys(elapsed) {
		super.handleKeys(elapsed);
		this.compositeCompositeFigure.handleKeys(elapsed);
	}

	/**
	 * Animerer og tegner ...
	 */
	draw(elapsed, modelMatrix = new Matrix4()) {
		super.draw(elapsed);
		this.xzplane.draw(this.baseShaderInfo, elapsed, modelMatrix);
		this.compositeCompositeFigure.draw(this.baseShaderInfo, elapsed, modelMatrix);
	}
}

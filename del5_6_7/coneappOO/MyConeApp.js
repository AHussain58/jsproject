import {BaseApp} from '../../base/BaseApp.js';
import {Cone} from '../../base/shapes/Cone.js';

/**
 * Klassen representerer en WebGL-app som tegner en kjegle.
 */
export class MyConeApp extends BaseApp {

	constructor() {
		super(true);
		//  Kjegle:
		this.cone = new Cone(this, {red:0.5, green:0.9, blue:0, alpha:1}, 200);
		this.cone.initBuffers();
	}

	draw(elapsed, modelMatrix = new Matrix4()) {
		super.draw(elapsed);

		modelMatrix.setIdentity();
		this.cone.draw(this.baseShaderInfo, elapsed, modelMatrix);
	}
}

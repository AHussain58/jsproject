'use strict';
/*
    buffer og draw for PaperMan
*/
import {Stack} from '../../base/helpers/Stack.js';
import {Cube} from '../../base/shapes/Cube.js';
import {Cone} from '../../base/shapes/Cone.js';

/**
 * Klasse som implementerer en sammensatt figur.
 */
export class CompositeFigure {

    constructor(app) {
        this.app = app;

        this.stack = new Stack();

        this.cube = new Cube(app, {red:0.3, green:0.44, blue:0.6, alpha:1}, false);
        this.cube.initBuffers();

        this.cone = new Cone(app);
        this.cone.initBuffers();

        this.translationX = 0;
    }

    handleKeys(elapsed) {
        // Dersom ev. del-figur skal animeres håndterer den det selv.
        //this.cone.handleKeys(elapsed);
        // Flytter hele figuren:
        if (this.app.currentlyPressedKeys[89]) {    //Y
            this.translationX = this.translationX + 1*elapsed;
        }
        if (this.app.currentlyPressedKeys[85]) {    //U
            this.translationX = this.translationX - 1*elapsed;
        }
    }

    //MERK: Kaller ikke super.draw() siden klassen ikke arver fra BaseShape:
    draw(shaderInfo, elapsed, modelMatrix = new Matrix4()) {

        this.stack.pushMatrix(modelMatrix);	 	//Legges på toppen av stacken.

        // Tegner diverse:
        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,2,0);
        modelMatrix.scale(2,1,2);
        this.cone.draw(shaderInfo, elapsed, modelMatrix);

        modelMatrix = this.stack.peekMatrix();
        modelMatrix.translate(0,1,0);
        this.cube.draw(shaderInfo, elapsed, modelMatrix);

        //Tømmer stacken ...:
        this.stack.empty();
    }
}



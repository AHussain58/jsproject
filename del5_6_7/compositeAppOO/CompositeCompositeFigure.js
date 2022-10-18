'use strict';
/*
    buffer og draw for PaperMan
*/
import {Stack} from '../../base/helpers/Stack.js';
import {CompositeFigure} from "./CompositeFigure.js";

/**
 * Klasse som implementerer en sammensatt figur.
 */
export class CompositeCompositeFigure {

    constructor(app) {
        this.app = app;

        this.stack = new Stack();

        this.compositeFigure1 = new CompositeFigure(this.app);
        this.compositeFigure2 = new CompositeFigure(this.app);

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
        modelMatrix.setIdentity();

        // Tegner:
        modelMatrix.translate(-10,0,0);
        modelMatrix.scale(1,1,1);
        this.compositeFigure1.draw(shaderInfo, elapsed, modelMatrix);

        modelMatrix.translate(20,0,0);
        this.compositeFigure2.draw(shaderInfo, elapsed, modelMatrix);
    }
}



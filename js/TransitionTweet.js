var TweetTransitionParameter = {
    distanceFade: 50.0,
};


var TransitionUpdateCallback = function(target) { 
    this._target = target;

    if (EnableTweaking) {
        if (TransitionUpdateCallback.slider === undefined) {
            var domTarget = document.getElementById('Parameters');
            osgUtil.ParameterVisitor.createSlider('distance', 
                                                  'fadeTweetDistance',
                                                  TweetTransitionParameter,
                                                  'distanceFade',
                                                  TweetTransitionParameter.distanceFade,
                                                  0.0,
                                                  400.0,
                                                  1.0, domTarget);

            TransitionUpdateCallback.slider = true;
        }
    }

};

function CheckNaN(a) {
    for (var i = 0, l = a.length; i < l; i++ ) {
        if ( isNaN(a[i]) || Math.abs(a[i]) > 100000000) {
            return true;
        }
    }
}

TransitionUpdateCallback.prototype = {

    getVelocityField: function (pos, time ) {
        var t = time/1000.0;
        var vx = 0.0+Math.cos(0.5+2.0*(pos[0]*pos[0]*t));
        var vy = Math.cos(4.0*(pos[1]*t) + Math.sin(4.0*pos[0]*t*t));
        var vz = Math.cos(pos[2]*2.0*t);
        var factor = 0.01;
        var vec = [ vx, vy, vz];
        osg.Vec3.normalize(vec, vec);
        vec[0] *= factor;
        vec[1] *= factor;
        vec[2] *= factor;
        return vec;
    },
    updateMaterial: function(distanceSqr, stateset) {
        var startFade = TweetTransitionParameter.distanceFade;
        startFade *= startFade;
        var fadeRatio = osgAnimation.EaseInCubic(Math.min(distanceSqr/startFade, 1.0));
        var alphaUniform = stateset.getUniform('fade');
        if (alphaUniform === undefined) {
            alphaUniform = osg.Uniform.createFloat1(1.0, 'fade');
            stateset.addUniform(alphaUniform);
        }
        if (fadeRatio < 0.01) {
            return false;
        }
        alphaUniform.get()[0] = fadeRatio;
        alphaUniform.dirty();
        return true;
    },

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;

        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;

        var m = node.getMatrix();
        var current = [];
        osg.Vec3.copy(node._currentPosition, current);
        if (CheckNaN(current)) {
            node.setNodeMask(0x0);
            return false;
        }
        //osg.Matrix.getTrans(m, current);
        var target = this._target;

        var dx = target[0] - current[0];
        var dy = target[1] - current[1];
        var dz = target[2] - current[2];

        var speedSqr = dx*dx + dy*dy + dz*dz;

        if (!this.updateMaterial(speedSqr, node.getOrCreateStateSet())) {
            node.setNodeMask(0x0);
            return false;
        }
        var maxSpeed = 1.0;
        var maxSpeedSqr = maxSpeed*maxSpeed;
        if (speedSqr > maxSpeedSqr) {
            var quot = maxSpeed/Math.sqrt(speedSqr);
            dx *= quot;
            dy *= quot;
            dz *= quot;
        }
        
        var ratio = osgAnimation.EaseInQuad(Math.min((t-node._startDissolve)/2.0, 1.0));
        ratio = Math.max(ratio, 0.0);

        var attractVector = [];
        attractVector[0] = (dx * dt) * ratio;
        attractVector[1] = (dy * dt) * ratio;
        attractVector[2] = (dz * dt) * ratio;

        var delta = [];
        osg.Vec3.sub(node._currentPosition, node._lastPosition, delta);
        
        var speedSqr = delta[0] * delta[0] + delta[1] * delta[1] + delta[2]*delta[2];
        //var windFactor = - Math.min(2.0 * speedSqr * dt, 1000.0);
        var windFactor = - 0.01 * speedSqr;
        var windVector = [ windFactor*delta[0],
                           windFactor*delta[1],
                           windFactor*delta[2] ];

        var vecSpeed = [];
        var windNoise = this.getVelocityField(current, t);
        osg.Vec3.add(delta, windVector , vecSpeed);
        osg.Vec3.add(vecSpeed, current, current);
        osg.Vec3.add(attractVector, current, current);
        osg.Vec3.add(windNoise, current, current);

    
        osg.Vec3.copy(node._currentPosition, node._lastPosition);
        osg.Vec3.copy(current, node._currentPosition);

        var localRotation = [];
        osg.Matrix.makeRotate((t-node._startDissolve)*2.0 * ratio, node._axis[0], node._axis[1], node._axis[2] , localRotation);
        osg.Matrix.mult(node._rotation, localRotation, m);

        osg.Matrix.setTrans(m, current[0], current[1], current[2]);
        return true;
    }
};

var createTexturedBox = function(centerx, centery, centerz,
                                 sizex, sizey, sizez,
                                 l, r, b ,t)
{
    var model = osg.createTexturedBoxGeometry(centerx,
                                              centery,
                                              centerz,
                                              sizex,
                                              sizey,
                                              sizez);

    if (false) {
        model.drawImplementation = function(state) {
            //osg.log("Here");
            osg.Geometry.prototype.drawImplementation.call(this, state);
        };
    }
    var uvs = model.getAttributes().TexCoord0;
    var array = uvs.getElements();

    if (false) {
        array[0] = l; array[1] = t;
        array[2] = l; array[3] = b;
        array[4] = r; array[5] = b;
        array[6] = r; array[7] = t;

        array[8] = l; array[9] = t;
        array[10] = l; array[11] = b;
        array[12] = r; array[13] = b;
        array[14] = r; array[15] = t;
    } else {
        array[0] = 0; array[1] = t;
        array[2] = 0; array[3] = b;
        array[4] = 0; array[5] = b;
        array[6] = 0; array[7] = t;

        array[8] = 0; array[9] = 0;
        array[10] = 0; array[11] = 0;
        array[12] = 0; array[13] = 0;
        array[14] = 0; array[15] = 0;
    }

    if (true) {
        array[16] = 0; array[17] = 0;
        array[18] = 0; array[19] = 0;
        array[20] = 0; array[21] = 0;
        array[22] = 0; array[23] = 0;

        array[24] = 0; array[25] = 0;
        array[26] = 0; array[27] = 0;
        array[28] = 0; array[29] = 0;
        array[30] = 0; array[31] = 0;
    } else {
        array[16] = l; array[17] = t;
        array[18] = l; array[19] = b;
        array[20] = r; array[21] = b;
        array[22] = r; array[23] = t;

        array[24] = l; array[25] = t;
        array[26] = l; array[27] = b;
        array[28] = r; array[29] = b;
        array[30] = r; array[21] = t;
    }

    if (false) {
        array[32] = 0; array[33] = 0;
        array[34] = 0; array[35] = 0;
        array[36] = 0; array[37] = 0;
        array[38] = 0; array[39] = 0;

        array[40] = 0; array[41] = 0;
        array[42] = 0; array[43] = 0;
        array[44] = 0; array[45] = 0;
        array[46] = 0; array[47] = 0;
    } else {
        array[32] = l; array[33] = t;
        array[34] = l; array[35] = b;
        array[36] = r; array[37] = b;
        array[38] = r; array[39] = t;

        array[40] = r; array[41] = t;
        array[42] = r; array[43] = b;

        array[44] = l; array[45] = b;
        array[46] = l; array[47] = t;
    }
    return model;
};

var createEffect = function(texture, target, matrix, time, initialSpeed) {

    var totalSizeX = 512 * TweetScale;
    var maxx = 8;

    var sizex = totalSizeX/maxx;
    var maxy = maxx/4;

    var size = [sizex, sizex, sizex/3];

    var group = new osg.MatrixTransform();
    group.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    var cb = new TransitionUpdateCallback(target);
    
    var vOffset = 1.0-texture.vOffset;
    var vSize = texture.vOffset;

    var center = [];
    osg.Matrix.getTrans(matrix, center);

    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr = new osg.MatrixTransform();
            var rx = x*size[0] - maxx*size[0]*0.5 + size[0]*0.5;
            var rz = 0;
            var ry = y*size[1] - maxy*size[1]*0.5 + size[1]*0.5;

            var matrixTranslate = [];
            osg.Matrix.makeTranslate(rx,ry,rz, matrixTranslate);
            osg.Matrix.postMult(matrix, matrixTranslate);
            mtr.setMatrix(matrixTranslate);
            var pos = [];
            osg.Matrix.getTrans(matrixTranslate, pos);

            var model = createTexturedBox(0,0,0,
                                          size[0], size[1], size[2],
                                          x/(maxx), (x+1)/(maxx),
                                          vOffset + vSize*y/(maxy),
                                          vOffset + vSize*(y+1)/(maxy));

            mtr.addChild(model);
            group.addChild(mtr);
            mtr.addUpdateCallback(cb);
            var t = time;
            var t2 = (x*maxy + y)*0.07 + time;
            mtr._lastUpdate = t;
            mtr._startDissolve = t2;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random()];
            mtr._initialSpeed = initialSpeed;
            mtr._rotation = [];
            osg.Matrix.copy(matrix, mtr._rotation);
            osg.Matrix.setTrans(mtr._rotation, 0,0,0);

            mtr._lastPosition = [];
            mtr._currentPosition = [pos[0], pos[1], pos[2]];

            osg.Vec3.sub(pos, initialSpeed, mtr._lastPosition);
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }
    return group;
};

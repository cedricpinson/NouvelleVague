var TransitionUpdateCallback = function(target) { this._target = target};
TransitionUpdateCallback.prototype = {

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;
        if (dt < 0 || true) {
            return true;
        }
        node._lastUpdate = t;

        var m = node.getMatrix();
        var current = [];
        osg.Matrix.getTrans(m, current);
        var target = this._target;
        var dx = target[0] - current[0];
        var dy = target[1] - current[1];
        var dz = target[2] - current[2];

        var speedSqr = dx*dx + dy*dy + dz*dz;
        var maxSpeed = 10.0;
        var maxSpeedSqr = maxSpeed*maxSpeed;
        if (speedSqr > maxSpeedSqr) {
            var quot = maxSpeed/Math.sqrt(speedSqr);
            dx *= quot;
            dy *= quot;
            dz *= quot;
        }
        //osg.log("speed " + Math.sqrt(dx*dx + dy*dy + dz*dz) );
        
        var ratio = osgAnimation.EaseInQuad(Math.min((t-node._start)/2.0, 1.0));
        current[0] += dx * dt * ratio;
        current[1] += dy * dt * ratio;
        current[2] += dz * dt * ratio;

        osg.Matrix.makeRotate((t-node._start) * ratio, node._axis[0], node._axis[1], node._axis[2] ,m);
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

var createEffect = function(texture, target, center) {

    var totalSizeX = 200;
    var maxx = 20;

    var sizex = totalSizeX/maxx;
    var maxy = maxx/4;

    var size = [sizex, sizex, sizex];

    var group = new osg.MatrixTransform();
    group.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    var cb = new TransitionUpdateCallback(target);
    
    var vOffset = 1.0-texture.uvRange[1];
    var vSize = texture.uvRange[1];

    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr = new osg.MatrixTransform();
            var rx = x*size[0] - maxx*size[0]*0.5 + center[0];
            var rz = 0 + center[1];
            var ry = y*size[2] - maxy*size[2]*0.5 + center[2];
            mtr.setMatrix(osg.Matrix.makeTranslate(rx,ry,rz,[]));

            var model = createTexturedBox(0,0,0,
                                          size[0], size[1], size[2],
                                          x/(maxx), (x+1)/(maxx),
                                          vOffset + vSize*y/(maxy), vOffset + vSize*(y+1)/(maxy));

            mtr.addChild(model);
            group.addChild(mtr);
            mtr.addUpdateCallback(cb);
            var t = (x*maxy + y)*0.1;
            mtr._lastUpdate = t;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random()];
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }
    return group;
};

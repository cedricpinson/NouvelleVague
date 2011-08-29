var computeDirectionMatrix = function(eye, center, result) {
    var up = [0 , 0 , 1];
    var f = center;

    var s = osg.Vec3.cross(f, up, []);
    osg.Vec3.normalize(s, s);

    var u = osg.Vec3.cross(s, f, []);
    osg.Vec3.normalize(u, u);

    // s[0], u[0], -f[0], 0.0,
    // s[1], u[1], -f[1], 0.0,
    // s[2], u[2], -f[2], 0.0,
    // 0,    0,    0,     1.0

    result[0]=f[0]; result[1]=f[1]; result[2]=f[2]; result[3]=0.0;
    result[4]=-s[0]; result[5]=-s[1]; result[6]=-s[2]; result[7]=0.0;
    result[8]=0;    result[9]=0;    result[10]=1;   result[11]=0.0;
    result[12]=  0; result[13]=  0; result[14]=  0; result[15]=1.0;

    //osg.Matrix.transpose(result, result);

    osg.Matrix.postMult(osg.Matrix.makeTranslate(eye[0], eye[1], eye[2], []), result);
    //osg.Matrix.multTranslate(result, eye, result);
};

var MotionUpdateCallback = function(itemRoot, itemShadow) {
    this.shadowNode = itemShadow;
    this.itemNode = itemRoot;

    this.direction = [0,1,0];
    this.position = [0,0,0];
    this.ground = -22.5;

};

MotionUpdateCallback.prototype = {
    update: function(node, nv) {
        var r = nv.getFrameStamp().getSimulationTime();
        r = r % 200.0;
        var dist = osg.Vec3.mult(this.direction, r*10,  []);
        var pos = osg.Vec3.add(this.position, dist, []);

        var m = this.itemNode.getMatrix();
        var mlocal = osg.Matrix.makeRotate(-Math.PI/2.0, 0 ,0, 1, []);
        mlocal = osg.Matrix.makeRotate(-Math.PI/2.0, 1 ,0 , 0, []);
        osg.Matrix.postMult(osg.Matrix.makeRotate(-Math.PI/2.0, 0 ,0 , 1, []), mlocal);
        //mlocal = osg.Matrix.makeIdentity([]);
        computeDirectionMatrix(pos, this.direction, m);

        osg.Matrix.preMult(m, mlocal);

        if (this.shadowNode) {
            var shadowMatrix = this.shadowNode.getMatrix();
            var itemTranslation = [];
            osg.Matrix.getTrans(m, itemTranslation);
            osg.Matrix.copy(m, shadowMatrix);
            osg.Matrix.setTrans(shadowMatrix, itemTranslation[0],itemTranslation[1], this.ground);
        }

        node.traverse(nv);
    }
};
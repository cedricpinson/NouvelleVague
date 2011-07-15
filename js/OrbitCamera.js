osgGA.UltraNoirManipulator = function () {
    osgGA.OrbitManipulator.call(this);
    this.minAltitude = 10;
};

osgGA.UltraNoirManipulator.prototype = osg.objectInehrit(osgGA.OrbitManipulator.prototype, {
    computeRotation: function(dx, dy) {
        var of = osg.Matrix.makeRotate(dx / 10.0, 0,0,1);
        var r = osg.Matrix.mult(this.rotation, of, []);

        of = osg.Matrix.makeRotate(dy / 10.0, 1,0,0);
        var r2 = osg.Matrix.mult(of, r, []);

        // test that the eye is not too up and not too down to not kill
        // the rotation matrix
        var eye = osg.Matrix.transformVec3(osg.Matrix.inverse(r2), [0, this.distance, 0]);
        if (eye[2] < this.minAltitude) {
            this.rotation = r;
            return;
        }

        var dir = osg.Vec3.neg(eye, []);
        osg.Vec3.normalize(dir, dir);

        var p = osg.Vec3.dot(dir, [0,0,1]);
        if (Math.abs(p) > 0.95) {
            //discard rotation on y
            this.rotation = r;
            return;
        }
        this.rotation = r2;
    }

});
var Linear = function() {
    this.keys = [];
};

Linear.prototype = {
    getValue: function(t, result) {

        var i = 0;
        if (t >= (1.0 - 1e-4)) {
            i = this.keys.length-3;
            return [this.keys[i], this.keys[i+1], this.keys[i+2]];
        }

        if (t <= 0.0) {
            i = this.keys.length-3;
            return [this.keys[i], this.keys[i+1], this.keys[i+2]];
        }

        var idx = t * (this.keys.length/3-1);
        var f = Math.floor(idx);
        var e = f + 1;

        var frac = idx - f;
        var blend = frac;
        f = f * 3;
        e = e * 3;
        var r1 = osg.Vec3.mult( [this.keys[f], this.keys[f+1], this.keys[f+2]], 1.0 - frac, []);
        var r2 = osg.Vec3.mult( [this.keys[e], this.keys[e+1], this.keys[e+2]], frac, []);
        return osg.Vec3.add(r1, r2, result);
    }
};


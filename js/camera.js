var CameraManger = function(manipulator, list) {
    this.current = undefined;
    this.list = list;
    this.manipulator = manipulator;

    var self = this;
    this.manipulator.getInverseMatrix = function() {
        var eye = self.getEyePosition();
        this.eye = eye;
        //osg.log(eye);
        return osgGA.FirstPersonManipulator.prototype.getInverseMatrix.call(this);
    };
};

CameraManger.prototype = {
    getEyePosition: function() {
        if (this.current === undefined) {
            this.current = 0;
        }
        var node = this.list[this.current];
        var m = node.getWorldMatrices();
        var pos = [];
        osg.Matrix.getTrans(m[0], pos);
        osg.Vec3.add([10,0,0],pos,pos);
        return pos;
    },
    nextCamera: function() {
        var next = (this.current + 1) % this.list.length;
        this.manipulator.init();
        this.current = next;
    }
};

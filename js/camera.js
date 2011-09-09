var CameraManger = function(manipulator, list) {

    this.list = [];
    var finder = new FindNodeVisitor("CameraPosition");
    finder.setNodeMaskOverride(~0x0);
    for (var i = 0, l = list.length; i < l; i++) {
        finder.init();
        list[i].accept(finder);
        if (finder.found.length === 0) {
            osg.log("Camera Item not found");
            continue;
        }
        this.list.push(finder.found[0]);
    }

    //this.list = list;
    this.manipulator = manipulator;

    var self = this;
    var manipulatorList = this.manipulator.getManipulatorList();
    manipulatorList[0].getInverseMatrix = function() {
        var eye = self.getEyePosition();
        this.eye = eye;
        //osg.log(eye);
        return osgGA.FirstPersonManipulator.prototype.getInverseMatrix.call(this);
    };

    // the last is the orbit camera
    this.current = this.list.length;
};

CameraManger.prototype = {
    getEyePosition: function() {
        var node = this.list[this.current];
        var m = node.getWorldMatrices();
        var pos = [];
        osg.Matrix.getTrans(m[0], pos);
        //osg.Vec3.add([10,0,0],pos,pos);
        return pos;
    },
    nextCamera: function() {
        var next = (this.current + 1) % (this.list.length+1);
        if (next === 0) {
            this.manipulator.setManipulatorIndex((this.manipulator.getCurrentManipulatorIndex() + 1) %this.manipulator.getNumManipulator());        }
        else if (next === this.list.length) {
            this.manipulator.setManipulatorIndex((this.manipulator.getCurrentManipulatorIndex() + 1) %this.manipulator.getNumManipulator());
        }
        if (next !== this.list.length) {
            this.manipulator.reset();
        }
        this.current = next;
    }
};

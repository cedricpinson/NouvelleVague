var switchCamera = function(type) {
    cameraManager.selectNextCameraOfType(type);
};

var CameraManager = function(manipulator, list) {

    this.itemList = list;
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
        var matrix = self.getCameraMatrix();
        var inv = [];
        osg.Matrix.inverse(matrix, inv);
        return inv;
    };

    // the last is the orbit camera
    this.current = this.list.length;

    // user asked for camera
    this.userAskedForCamera = false;
    this.userAskedForCameraTimeout = undefined;

    // max timeout
    this.userForceDuration = 20;
};

CameraManager.prototype = {
    userForcedCamera: function() {
        return this.userAskedForCamera;
    },
    userForceCamera: function() {
        if (this.userAskedForCameraTimeout !== undefined) {
            clearTimeout(this.userAskedForCameraTimeout);
        }

        this.userAskedForCamera = true;
        var self = this;
        this.userAskedForCameraTimeout = setTimeout(function() {
            self.userAskedForCamera = false;
            self.userAskedForCameraTimeout = undefined;
        }, this.userForceDuration * 1000);
    },
    selectNextCameraOfType: function(type) {

        var arrayIndex = [];
        this.getCameraOfType(type, arrayIndex);

        var bestOne = undefined;

        var start = arrayIndex.indexOf(this.current) + 1;
        for (var i = start, l = start + arrayIndex.length; i < l; i++) {
            var cIndex = i % arrayIndex.length;
            bestOne = arrayIndex[cIndex];
            break;
        }

        this.nextCamera(bestOne);
        this.userForceCamera();
    },
    getCameraOfType: function(typeName, result) {
        result.length = 0;
        for ( var i = 0, l = this.list.length; i < l; i++) {
            var item = this.list[i];
            if ( item !== undefined) {
                var conf = item.conf;
                if (conf.name === typeName) {
                    result.push(i);
                }
            }
        }
    },
    mainView: function() {
        var main = this.list.length;
        if (this.current !== main) {
            this.nextCamera(main);
            this.userForceCamera();
        }
    },
    getEyePosition: function() {
        var pos = [];
        if (this.itemList[this.current] !== undefined) {
            // not active so switch of camera
            if (this.itemList[this.current].isAvailable()) {
                this.nextCamera();
            }
        }
        var node = this.list[this.current];
        if (node === undefined) {
            var m = this.manipulator.getCurrentManipulator().getInverseMatrix();
            var inv = [];
            osg.Matrix.inverse(m, inv);
            osg.Matrix.getTrans(inv, pos);
        } else {
            var m = node.getWorldMatrices();
            osg.Matrix.getTrans(m[0], pos);
        }
        //osg.Vec3.add([10,0,0],pos,pos);
        return pos;
    },

    getCameraMatrix: function() {
        var pos = [];
        var node = this.list[this.current];
        if (node === undefined) {
            var m = this.manipulator.getCurrentManipulator().getInverseMatrix();
            var inv = [];
            osg.Matrix.inverse(m, inv);
            return inv;
        } else {
            var m = node.getWorldMatrices();
            return m[0];
        }
        //osg.Vec3.add([10,0,0],pos,pos);
        return pos;
    },

    findNext: function() {
        var valid = undefined;
        for (var i = this.current+1, l = this.current + this.itemList.length+1 ; i < l; i++) {
            var index = i % (this.itemList.length+1);
            var item = this.itemList[index];
            if ( item !== undefined) {
                // check if active
                if (!item.isAvailable()) {
                    return index;
                }
            } else {
                return index;
            }
        }
        return this.itemList.length;
    },
    nextCamera: function(next) {
        var registerCameraEventSlider = function(configuration) {
            return;

            var n = document.getElementById("CameraName");
            n.innerHTML = configuration.name;

            var func = function(conf, field, name, field2, index) {
                var cb = conf.changeValue;
                var e = document.getElementById("Change"+name);
                e.addEventListener("change", cb[field]);
                var id = conf.name + "_" + name;
                var v = window.localStorage.getItem(id);
                osg.log("get " + id + " " + v);
                if (v) {
                    v = parseFloat(v);
                } else {
                    v = conf[field2][index];
                }
                cb[field](v);
                e.value = v;
            };

            func(configuration, 'translateX', "CameraTranslateX", 'translate', 0);
            func(configuration, 'translateY', "CameraTranslateY", 'translate', 1);
            func(configuration, 'translateZ', "CameraTranslateZ", 'translate', 2);

            func(configuration, 'rotateX', "CameraRotateX", 'rotate', 0);
            func(configuration, 'rotateY', "CameraRotateY", 'rotate', 1);
            func(configuration, 'rotateZ', "CameraRotateZ", 'rotate', 2);
        };

        var removeCameraEventSlider = function(configuration) {
            return;

            var conf = configuration.changeValue;
            var ex = document.getElementById("ChangeCameraTranslateX");
            ex.removeEventListener("change", conf.translateX);

            var ey = document.getElementById("ChangeCameraTranslateY");
            ey.removeEventListener("change", conf.translateY);

            var ez = document.getElementById("ChangeCameraTranslateZ");
            ez.removeEventListener("change", conf.translateZ);

            var rx = document.getElementById("ChangeCameraRotateX");
            rx.removeEventListener("change", conf.rotateX);

            var ry = document.getElementById("ChangeCameraRotateY");
            ry.removeEventListener("change", conf.rotateY);

            var rz = document.getElementById("ChangeCameraRotateZ");
            rz.removeEventListener("change", conf.rotateZ);
        };

        if (next === undefined) {
            next = this.findNext();
        }
        var current = this.current;
        if (current !== this.list.length) {
            removeCameraEventSlider(this.list[current].conf);
        }
        if (next !== this.list.length) {
            registerCameraEventSlider(this.list[next].conf);
            this.manipulator.setManipulatorIndex(0);
        } else {
            this.manipulator.setManipulatorIndex(1);
        }

        if (next !== this.list.length) {
            this.manipulator.reset();
        }
        this.current = next;
    }
};

var getPropellerUpdateCallback = function() {

    var UpdateCallback = function() {};
    UpdateCallback.prototype = {
        update: function(node, nv) {
            if (node.originalMatrix === undefined) {
                node.originalMatrix = osg.Matrix.copy(node.getMatrix(), []);
                node.rotateMatrix = [];
            }
            var currentTime = nv.getFrameStamp().getSimulationTime();
            osg.Matrix.makeRotate(currentTime, 0,0,1, node.rotateMatrix);
            osg.Matrix.mult(node.originalMatrix, node.rotateMatrix, node.getMatrix());
            return true;
        }
    };

    if (getPropellerUpdateCallback.callback === undefined) {
        getPropellerUpdateCallback.callback = new UpdateCallback;
    }
    return getPropellerUpdateCallback.callback;
};

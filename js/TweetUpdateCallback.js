var TweetUpdateCallback = function(geometry) { 
    this._tweetGeometry = geometry;
    this._lastPosition = undefined;
};

TweetUpdateCallback.prototype = {
    addTweet: function(tweet) {
        this._newTweet = tweet;
    },
    transition: function() {
        this._executeTransition = true;
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();

        if (this._newTweet !== undefined) {
            createTweetModel(this._newTweet, this._tweetGeometry);
            this._tweetGeometry.setNodeMask(~0x0);
            if (node.hasChild(this._executeTransition)) {
                node.removeChild(this._executeTransition);
            }
            this._tweetGeometry.setNodeMask(~0x0);
            this._newTweet = undefined;
        }

        var matrix;
        var inv;
        if (this._executeTransition) {
            if (this._transition !== undefined) {
                node.removeChild(this._transition);
            }
            matrix = node.getWorldMatrices()[0];
            var stateset = this._tweetGeometry.getStateSet();
            var texture = stateset.getTextureAttribute(0,'Texture');
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            var speed = [];
            if (this._lastPosition === undefined) {
                this._lastPosition = trans;
            }
            osg.Vec3.sub(trans, this._lastPosition, speed);
            this._lastPosition = trans;

            inv = [];
            osg.Matrix.inverse(matrix, inv);
            
            this._transition = createEffect(texture, [ 0 ,0 ,10], matrix, t, speed);
            //this._transition.getOrCreateStateSet().setAttributeAndMode(getTextShader());
            this._transition.setMatrix(inv);
            this._executeTransition = false;
            node.addChild(this._transition);
            this._tweetGeometry.setNodeMask(0x0);

        } else {
            matrix = node.getWorldMatrices()[0];
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            this._lastPosition = trans;

            if (this._transition !== undefined) {
                inv = [];
                osg.Matrix.inverse(matrix, inv);
                this._transition.setMatrix(inv);
            }
        }
        return true;
    }
};
var consumeTweets = function(tweetList) {
    twitterManager.addList(tweetList);
};

var TweetManager = function(list) { 
    this.index = 0;
    this._list = list; 
    this._tweetList = [];
    this._tweetRate = 1.0; // tweet per second;
};

TweetManager.prototype = {
    addList: function(tweetList) {
        var nb = this._tweetList.length;
        var max = 200;
        if (nb > max) {
            return;
        }
        var nbToKeep = max - nb;
        nbToKeep = Math.min(nbToKeep, tweetList.length);
        for (var i = 0, l = nbToKeep; i < l; i++) {
            this._tweetList.unshift(tweetList[nbToKeep-1-i]);
        }
    },

    getTweet: function() {
        this.index += 1;

        if (this._tweetList.length > 0) {
            return this._tweetList.pop();
        }
        if (false && this.index > 20) {
            return undefined;
        }

        var k = "";
        for (var kk = 0; kk < 130; kk++ ) {
            k = k + "X";
        }
        var text = k;
        var text = text.replace(/X/gi, this.index.toString());
        text = text.substr(0, 139);
        return { 'text': text,
                 'from_user': "TriGrou",
                 'created_at': new Date().toString()
               };

        return { text: "Looking for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk",
                 from_user: "TriGrou",
                 created_at: new Date().toString()
               };
    },

    processTweetOnItem: function( item, tweet) {
        if (tweet !== undefined) {
            item.runTweet(tweet);
        } else {
            item.setNodeMask(0x0);
        }
    },
    setRate: function(rate) {
        this._tweetRate = rate;
    },
    getNbTweetToConsume: function() {
        if (this.lastCall === undefined) {
            this.lastCall = (new Date()).getTime();
        }
        var lastCall = this.lastCall;

        var now = (new Date()).getTime();
        var elapsed = (now-lastCall)/1000.0;

        var ratio = this._tweetRate;
        var nbTweets = elapsed * ratio;
        
        var clamped = Math.floor(nbTweets);

        var diff = (nbTweets-clamped)*1000.0/ratio;
        if (clamped > 0) {
            this.lastCall = now - diff;
        }

        return clamped;
    },

    update: function() {
        if (Intro === true) {
            this.lastCall = (new Date()).getTime();
            return;
        }

        var nb = this.getNbTweetToConsume();
        if (nb === 0) {
            return;
        }
        var list = this._list;
        for (var i = 0, l = list.length; i < l; i++) {
            var item = list[i];
            if (item.isAvailable()) {
                this.processTweetOnItem(item, this.getTweet());
                nb--;
                if (nb === 0) {
                    break;
                }
            }
        }
    }
};



var createTweetTexture = function(tweet, texture) {
    var canvas;
    if (texture) {
        canvas = texture.getImage();
    }
    canvas = displayTweetToCanvas(tweet, canvas);

    var w = canvas.textureWidth;
    var h = canvas.textureHeight;
    var tx = 512;
    var ty = 128;

    var v = h/ty;

    if (texture === undefined) {
        texture = new osg.Texture();
        texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
    }
    texture.setFromCanvas(canvas,osg.Texture.LUMINANCE);

    texture.vOffset = v;
    texture.tweetSize = [ w, h];
    return texture;
};
var TweetScale = 0.05;
var createTweetModel = function(tweet, model) {
    var textureOriginal = undefined;
    var texture = undefined;
    if (model) {
        textureOriginal = model.getOrCreateStateSet().getTextureAttribute(0, 'Texture');
    }
    texture = createTweetTexture(tweet, textureOriginal);

    var scale = TweetScale;
    var w = texture.tweetSize[0] * scale;
    var h = w/4; //texture.tweetSize[1] * scale;
    if (model === undefined) {
        model = createTexturedBox(0.0, 0.0, 0.0,
                                  w, h, h/2.0/3.00,
                                  0.0, 1.0,
                                  1.0-texture.vOffset, 1.0);

        model.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
        model.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
        model.vOffset = texture.vOffset;
    }
    return [ model, texture];
};


var TweetUpdateCallback = function(geometry) { 
    this._tweetGeometry = geometry;
    this._lastPosition = undefined;
};

TweetUpdateCallback.prototype = {
    addTweet: function(tweet) {
        this._newTweet = tweet;
        this._tweetText = tweet;
    },
    transition: function() {
        if (this._tweetText) {
            this._executeTransition = true;
        }
    },
    getWorldMatrix: function(node) {
        var matrix = node.getWorldMatrices()[0];
        if (this._lastPosition === undefined) {
            this._lastPosition = [];
            osg.Matrix.getTrans(matrix, this._lastPosition);
        }
        return matrix;
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
            Ribbons.addTweet(this._tweetText);

            matrix = this.getWorldMatrix(node);
            var stateset = this._tweetGeometry.getStateSet();
            var texture = stateset.getTextureAttribute(0,'Texture');
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            var speed = [];
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

            this._tweetText = undefined;
        } else {
            matrix = this.getWorldMatrix(node);
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            this._lastPosition = trans;

            if (this._transition !== undefined) {
                inv = [];
                osg.Matrix.inverse(matrix, this._transition.getMatrix());
            }
        }
        return true;
    }
};
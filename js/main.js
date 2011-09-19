window.addEventListener("load", function() { start(); }, true );
var OrbitManipulator = undefined;
function changeTarget(value)
{
    document.getElementById('targetup').innerHTML = value;
    osg.log("up " + value);
    if (OrbitManipulator) {
        OrbitManipulator.setTarget([0,0,parseFloat(value)]);
        OrbitManipulator.setDistance(150);
    }
}

var ActiveItems = [];

var CameraManager = undefined;

var Moving1 = function (path) { this.path = path};
Moving1.prototype = {
    update: function (node, nv) {


        var ratio = 0;
        var currentTime = nv.getFrameStamp().getSimulationTime();
        if (node.startTime === undefined) {
            node.startTime = currentTime;
            if (node.duration === undefined) {
                node.duration = 5.0;
            }
        }

        var dt = currentTime - node.startTime;
        if (dt > node.duration) {
            //node.setNodeMask(0);
            node.startTime = undefined;
            return;
        }
        
        ratio = dt/node.duration;

        var value = (1.0 - osgAnimation.EaseInQuad(ratio));
        var pos = osg.Vec3.lerp(value, node.start, node.end, []);

        this.path.getValue(dt, pos);

        node.setMatrix(osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], []));
        
        node.traverse(nv);
    }
};

var getModel2 = function(b) {
    var child = new osg.createTexturedBox(0,0,25, 50,50,50);
    var transform = new osg.MatrixTransform();
    transform.addChild(child);

    transform.start = [0, -100, 0];
    transform.end = [0, 100, 0];
    transform.setUpdateCallback(new Moving1(b));
    return transform;
};


var createQuadMotionScene = function(source, target) {
    
    var CB = function() {};
    CB.prototype = {
        update: function(node, nv) {
            var ratio = 0;
            var currentTime = nv.getFrameStamp().getSimulationTime();
            if (node.startTime === undefined) {
                node.startTime = currentTime;
                if (node.duration === undefined) {
                    node.duration = 10.0;
                }
            }

            var dt = currentTime - node.startTime;
            if (dt > node.duration) {
                //node.setNodeMask(0);
                node.startTime = undefined;
                return;
            }
            
            ratio = dt/node.duration;
            
            var value = (1.0 - osgAnimation.EaseInQuad(ratio));
            var pos = osg.Vec3.lerp(value, node.source, node.target, []);

            
            node.setMatrix(osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], []));
            node.traverse(nv);
        }
    };
    
    var q = osg.createTexturedQuad(-0.5,  0, -0.5,
                                   1 ,0 ,0,
                                   0 ,0 ,1);

    var m = new osg.MatrixTransform();
    m.source = source;
    m.target = target;
    m.setUpdateCallback(new CB());
    m.addChild(q);

    return m;
};


var createTweet = function(tweet) {
    var ratio = 1024/32;
    var textSize = 80;
    var tweetSize = [textSize,textSize/ratio];
    var tweetModel = osg.createTexturedQuad(-tweetSize[0]/2, 0, -tweetSize[1]/2,
                                           tweetSize[0], 0 ,0,
                                           0, 0 ,tweetSize[1]);
    var canvas = getCanvasText(tweet);
    return [tweetModel, canvas];
};

var createTweet2 = function(tweet) {
    var canvas = displayTweetToCanvas(tweet);

    var scale = 0.03;
    var w = canvas.textureWidth * scale;
    var h = canvas.textureHeight;
    var tx = 512;
    var ty = 128;

    var v = h/ty;
    h *= scale; 
    var tweetModel = osg.createTexturedQuad(-w/2.0, -h/2.0, 0,
                                           w, 0, 0,
                                           0, h, 0,
                                           0, 1.0-v,
                                           1.0, 1.0);
    return [tweetModel, canvas];
};


var FindAnimationManagerVisitor = function() { 
    osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN); 
    this._cb = undefined
};
FindAnimationManagerVisitor.prototype = osg.objectInehrit( osg.NodeVisitor.prototype, {
    init: function() {
        this.found = [];
    },
    apply: function(node) {
        var cbs = node.getUpdateCallbackList();
        for (var i = 0, l = cbs.length; i < l; i++) {
            if ( cbs[0] instanceof osgAnimation.BasicAnimationManager ) {
                this._cb = cbs[0];
                return;
            }
        }
        this.traverse(node);
    }
});


function createShadowMatrix(ground, light, shadowMat)
{
    var dot;
    if (shadowMat === undefined) {
        shadowMat = [];
    }

    dot = ground[0] * light[0] +
          ground[1] * light[1] +
          ground[2] * light[2] +
          ground[3] * light[3];
    
    shadowMat[0] = dot - light[0] * ground[0];
    shadowMat[4] = 0.0 - light[0] * ground[1];
    shadowMat[8] = 0.0 - light[0] * ground[2];
    shadowMat[12] = 0.0 - light[0] * ground[3];
    
    shadowMat[1] = 0.0 - light[1] * ground[0];
    shadowMat[5] = dot - light[1] * ground[1];
    shadowMat[9] = 0.0 - light[1] * ground[2];
    shadowMat[13] = 0.0 - light[1] * ground[3];
    
    shadowMat[2] = 0.0 - light[2] * ground[0];
    shadowMat[6] = 0.0 - light[2] * ground[1];
    shadowMat[10] = dot - light[2] * ground[2];
    shadowMat[14] = 0.0 - light[2] * ground[3];
    
    shadowMat[3] = 0.0 - light[3] * ground[0];
    shadowMat[7] = 0.0 - light[3] * ground[1];
    shadowMat[11] = 0.0 - light[3] * ground[2];
    shadowMat[15] = dot - light[3] * ground[3];

    return shadowMat;
}


var createRotationMatrix = function()
{
    var mlocal = osg.Matrix.makeRotate(-Math.PI/2.0, 0 ,0, 1, []);
    mlocal = osg.Matrix.makeRotate(-Math.PI/2.0, 1 ,0 , 0, []);
    return mlocal;
};

var OffsetPosition = [100,0,55];
var Ground = -22.5 - OffsetPosition[2];
var ShadowCallbackPlane = function() {
    this.update = function(node, nv) {
        var nodeMatrix = osg.Matrix.mult(node.sourceNode.getMatrix(), createRotationMatrix(), []);
        var inv = [];
        osg.Matrix.inverse(nodeMatrix, inv);
        
        var m = osg.Matrix.makeIdentity([]);
        osg.Matrix.preMult(m, createShadowMatrix([0,0, 1, -Ground ], [0,0,1, 0]));
        osg.Matrix.preMult(m, node.sourceNode.getMatrix());
        osg.Matrix.preMult(m, createRotationMatrix());

        osg.Matrix.mult(inv, m , node.getMatrix());
        return true;
    };
};


var ShadowCallback = function() {
    this.update = function(node, nv) {
        var nodeMatrix = osg.Matrix.mult(node.sourceNode.getMatrix(), createRotationMatrix(), []);
        var inv = [];
        osg.Matrix.inverse(nodeMatrix, inv);
        
        var vecDir = [ osg.Matrix.get(nodeMatrix, 0, 0),
                       osg.Matrix.get(nodeMatrix, 0, 1),
                       osg.Matrix.get(nodeMatrix, 0, 2) ];
        var up = [0 , 0, 1];
        var side = osg.Vec3.cross(vecDir, up, []);
        osg.Vec3.cross(side, up, vecDir);
        var orient = osg.Matrix.makeIdentity([]);
        osg.Matrix.setRow(orient, 2, side[0], side[1], side[2], 0);
        osg.Matrix.setRow(orient, 1, up[0], up[1], up[2], 0);
        osg.Matrix.setRow(orient, 0, vecDir[0], vecDir[1], vecDir[2], 0);


        var shadowMatrix = node.getMatrix();
        var itemTranslation = [];
        osg.Matrix.getTrans(nodeMatrix, itemTranslation);
        osg.Matrix.copy(orient, shadowMatrix);
        osg.Matrix.setTrans(shadowMatrix, itemTranslation[0], itemTranslation[1], Ground);
        osg.Matrix.mult(inv, shadowMatrix , shadowMatrix);
        return true;
    };
};


var createMotionItem2 = function(node, shadow, anim, child, posTweetOffset, plane) {
    if (createMotionItem2.item === undefined) {
        createMotionItem2.item = 0;
    }

    var wayTransform = new osg.MatrixTransform();
    var offset = osg.Matrix.makeTranslate(OffsetPosition[0], OffsetPosition[1], OffsetPosition[2],[]);
    osg.Matrix.postMult(osg.Matrix.makeRotate(Math.PI/6 * createMotionItem2.item, 0,0,1, []), offset);
    wayTransform.setMatrix(offset);
    createMotionItem2.item += 1;

    
    var itemRoot = new osg.MatrixTransform();
    itemRoot.setMatrix(createRotationMatrix());
    child.addChild(itemRoot);
    itemRoot.addChild(node);

    var itemShadow = new osg.MatrixTransform();


    if (plane === true) {
        itemShadow.addChild(node);
        itemShadow.setStateSet(getShadowProgramTest());
        itemShadow.addUpdateCallback(new ShadowCallbackPlane());
    } else {
        itemShadow.addChild(shadow);
        itemShadow.addUpdateCallback(new ShadowCallback());
    }
    itemShadow.sourceNode = child;
    itemShadow.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    itemRoot.addChild(itemShadow);
    itemRoot.getOrCreateStateSet().setAttributeAndMode(getBlendState());


    var tweet = new osg.MatrixTransform();
    var camera = new osg.MatrixTransform();
    camera.setName("CameraPosition");
    tweet.addChild(camera);
    camera.setMatrix(osg.Matrix.makeTranslate(10, 0, 0, []));

    itemRoot.addChild(tweet);
    var tweetOffset = osg.Matrix.makeIdentity([]);
    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,1,0, []));
    osg.Matrix.postMult(osg.Matrix.makeTranslate(posTweetOffset[0], posTweetOffset[1], posTweetOffset[2], []), tweetOffset);
    tweet.setMatrix(tweetOffset);

    var tweetText = { text: "Looking for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk",
                      from_user: "TriGrou",
                      created_at: new Date().toString()
                    };

    var tweetGenerated = createTweet2(tweetText);
    var canvas = tweetGenerated[1];
    var tweetModel = tweetGenerated[0];
    tweet.addChild(tweetModel);


    var texture = new osg.Texture();
    texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
    texture.setFromCanvas(canvas,osg.Texture.LUMINANCE);

    tweetModel.getOrCreateStateSet().setAttributeAndMode(getTextShader());
    tweetModel.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    tweetModel.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));


    var finder = new FindAnimationManagerVisitor();
    anim.accept(finder);
    var animationManager = finder._cb;
    var lv = new osgAnimation.LinkVisitor();
    lv.setAnimationMap(animationManager.getAnimationMap());
    anim.accept(lv);
    animationManager.buildTargetList();
    var firstAnim = Object.keys(animationManager.getAnimationMap())[0];
    wayTransform.setNodeMask(0);
    if (firstAnim !== undefined) {
        setTimeout( function() {
            animationManager.playAnimation(firstAnim);
            wayTransform.setNodeMask(~0x0);
        }, Math.random()*7000.0);
    }

    wayTransform.addChild(anim);
    return wayTransform;
};


var playMusic = function() {
    var audioSound = document.getElementById('zik');
    audioSound.play();
};

var getAnimation = function(func, itemName) {
    var anim = osgDB.parseSceneGraph(func());
    var bp = new FindNodeVisitor(itemName);
    anim.accept(bp);
    var child = bp.found[0];
    return [anim, child ];
};

var TweetRibbon = function(grp) 
{
    var ring1Finder = new FindNodeVisitor("Ring1");
    grp.accept(ring1Finder);
    var ring1 = ring1Finder.found[0];
    var ring1StateSet = ring1.getOrCreateStateSet();
    ring1StateSet.setAttributeAndMode(getRingShader());

    var tt0 = osg.Uniform.createFloat1(1.0, "t0");
    ring1StateSet.addUniform(tt0);

    var ring2Finder = new FindNodeVisitor("Ring2");
    grp.accept(ring2Finder);
    var ring2 = ring2Finder.found[0];
    var ring2StateSet = ring2.getOrCreateStateSet();
    ring2StateSet.setAttributeAndMode(getRingShader());
    
    var t0 = osg.Uniform.createFloat1(1.0, "t0");
    ring2StateSet.addUniform(t0);

    this._ribbons = [ ring1StateSet,  ring2StateSet ];
    this._nodeRibbons = [ ring1,  ring2 ];
    this._ribbonsTime = [ 0, 0 ];
    this._ribbonsUnit = [ 0, 0 ];
    this._ribbonsText = [ [undefined, undefined] , [undefined, undefined] ];

    var uniform0 = osg.Uniform.createInt1(0,'Texture0');
    var uniform1 = osg.Uniform.createInt1(1,'Texture1');
    var uniform2 = osg.Uniform.createInt1(2,'Texture2');

    var createTexture = function(unit) {
        var texture = new osg.Texture();
        texture.setWrapS(osg.Texture.CLAMP_TO_EDGE);
        texture.setTextureSize(4096, 128);
        return texture;
    };

    ring1StateSet.addUniform(uniform0);
    ring1StateSet.addUniform(uniform1);
    ring1StateSet.addUniform(uniform2);
    ring1StateSet.setTextureAttributeAndMode(1,createTexture(1));
    ring1StateSet.setTextureAttributeAndMode(2,createTexture(2));

    ring2StateSet.addUniform(uniform0);
    ring2StateSet.addUniform(uniform1);
    ring2StateSet.addUniform(uniform2);
    ring2StateSet.setTextureAttributeAndMode(1,createTexture(1));
    ring2StateSet.setTextureAttributeAndMode(2,createTexture(2));

    var self = this;
    var UpdateCB = function() {
        this.update = function(node, nv) {
            var t = nv.getFrameStamp().getSimulationTime();
            t = self._ribbonsTime[node.ribbonIndex];
            node.t0.get()[0] = t;
            node.t0.dirty();
            //osg.log("time 0 " + t);

            //t = self._ribbonsTime[0][1];
            //node.t1.get()[0] = t;
            //node.t1.dirty();
            //osg.log("time 1 " + t);

            return true;
        };
    };

    var cb = new UpdateCB();
    ring2.t0 = t0;
    ring2.ribbonIndex = 1;
    ring2.addUpdateCallback(cb);

    ring1.t0 = tt0;
    ring1.ribbonIndex = 0;
    ring1.addUpdateCallback(cb);


    var stFinder = new FindNodeVisitor("Statue");
    grp.accept(stFinder);
    var statue = stFinder.found[0];
    statue.addUpdateCallback(this);
    this._lastUpdate = 0;
    this._tweetList = [];
};

TweetRibbon.prototype = {
    addTweetOnRibbon: function(ribbonIndex, textureUnit) {
        var self = this;
        var addTexture = function(index, unit) {
            // need a switch
            var texture;
            var tunit = unit+1;
            texture = this._ribbons[index].getTextureAttribute(tunit, 'Texture');
            this.addNewTweet(index, unit, texture);
        };
        addTexture.call(this, ribbonIndex, textureUnit);
    },

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();

        var dt = (t - this._lastUpdate) * 0.02;
        var limit = 1.0;

        for (var i = 0, l = 2; i < l; i++) {
            var ribbonTime = this._ribbonsTime[i];
            var unit = this._ribbonsUnit[i];
            var tr0 = ribbonTime + dt;
            if (tr0 > (limit + unit)) {
                //osg.log(tr0.toString()  + " add tweet " + this._tweetList[0].text + " on unit " + unit);
                unit = (unit + 1) % 2;
                this.addTweetOnRibbon(i,unit);
                this._ribbonsUnit[i] = unit;
            }
            this._ribbonsTime[i] = tr0%2.0;
        }

        this._lastUpdate = t;
        return true;
    },
    
    addTweet: function(tweet) {
        this._tweetList.push(tweet);
        for (var i = 0, l = 2; i < l; i++) {
            var ribbon = this._ribbonsText[i];
            if (ribbon[0] === undefined && ribbon[1] === undefined) {
                this._ribbonsTime[i] = 0;
                this.addTweetOnRibbon(i, 0);

                // to fix the second texture
                this._tweetList.splice(0,0,{ text: "" });
                this.addTweetOnRibbon(i, 1);
                this._ribbonsUnit[i] = 0;
                break;
            }
        }
    },
    addNewTweet: function(index, unit, texture) {
        var tweet;
        if (this._tweetList.length > 0) {
            tweet = this._tweetList.splice(0,1)[0];
        }
        this._ribbonsText[index][unit] = undefined;
        if (tweet) {
            this._ribbonsText[index][unit] = tweet;
            displayTweetToStatue(tweet, texture);
        }
    }
};

var addCloud = function(grp)
{
    var instanceCloud = function(grp, x, y, z) {
        var cloudsBillboard = createCloud();
        cloudsBillboard.setMatrix(osg.Matrix.makeTranslate(x,y,z, [] ));
        grp.addChild(cloudsBillboard);
    };

    instanceCloud(grp, 300, 150, 60);
    instanceCloud(grp, -260, 100, 80);
    instanceCloud(grp, 50, -100, 100);
};

var start = function() {

    var optionsURL = function() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    };
    var options = optionsURL();
    if (options.music === undefined) {
        playMusic();
    }

    var b = new BezierPath();
    b.addKey(0, [0,-1000,-1000], [0,00,0], [0,0,0]);
    b.addKey(5.0, [0,1000,0], [0,-50,0], [0,0,0]);
    

    var w,h;
    if (window.top == window ) {
        h = document.documentElement.clientHeight;
        w = document.documentElement.clientWidth;
    } else {
        h = window.parent.document.body.clientHeight;
        w = window.parent.document.body.clientWidth;
    }

    var canvas = document.getElementById("3DView");
    canvas.width = w;
    canvas.height = h;
    var viewer = new osgViewer.Viewer(canvas, { antialias: true, 
                                                preserveDrawingBuffer: false,
                                                premultipliedAlpha: true
                                              } );


    var mousedown = function(ev) {
        ev.stopPropagation();
    };
    document.getElementById("fog").addEventListener("mousedown", mousedown, false);
    //document.getElementById("color").addEventListener("mousedown", mousedown, false);

    viewer.init();
    var switchManipulator = new osgGA.SwitchManipulator();
    var fpsManipulator = new osgGA.FirstPersonManipulator();
    var orbitManipulator = new osgGA.UltraNoirManipulator();
    OrbitManipulator = orbitManipulator;
    switchManipulator.addManipulator(fpsManipulator);
    switchManipulator.addManipulator(orbitManipulator);
    switchManipulator.setManipulatorIndex(1);

    viewer.setupManipulator(switchManipulator);
    //viewer.setupManipulator(orbitManipulator);
    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);

    var grp = new osg.Node();

    (function() {
        var defaultTexture = new osg.Texture();
        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', 1);
        canvas.setAttribute('height', 1);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        defaultTexture.setImage(canvas, osg.Texture.ALPHA);
        defaultTexture.setUnrefImageDataAfterApply(true);
        grp.getOrCreateStateSet().setTextureAttributeAndMode(1, defaultTexture);
    })();

    grp.addChild( createBackground() );

    var statue = createStatue();
    var ribbons = new TweetRibbon(statue);
    var originalText = "// First for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk //";
    var testTweet1 = { text: "// First for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk //",
                      from_user: "TriGrou",
                      created_at: new Date().toString()
                    };
    var testTweet2 = { text: "// Second for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk //",
                      from_user: "Aie",
                      created_at: new Date().toString()
                    };

    for (var jj = 0, ll = 100; jj < ll; jj++) {
        var k = "";
        for (var kk = 0; kk < 130; kk++ ) {
            k = k + "X";
        }
        var text = k;
        var idx0 = jj*2;
        var idx1 = jj*2+1;
        var text0 = text.replace(/X/gi, idx0.toString());
        var text1 = text.replace(/X/gi, idx1.toString());
        ribbons.addTweet({ text: text0 });
        ribbons.addTweet({ text: text1 });
    }

    grp.addChild(statue);

    if (true) {
        var plane = createPlane();
        var planeAnimations = [];
        planeAnimations[0] = getAnimation(getPlaneAnim1,"Biplane_1");
        planeAnimations[1] = getAnimation(getPlaneAnim2,"Biplane_2");
        planeAnimations[2] = getAnimation(getPlaneAnim3,"Biplane_3");

        var tweetOffset = [0, -10, 0];
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[0][0], planeAnimations[0][1],
                                           tweetOffset, true));
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[1][0], planeAnimations[1][1],
                                           tweetOffset, true));
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[2][0], planeAnimations[2][1],
                                           tweetOffset, true));

        tweetOffset = [0, -27, 7];
        var zeppelin = createZeppelin();
        var zeppelinAnimations = [];
        zeppelinAnimations[0] = getAnimation(getZeppelinAnim1,"Zeppelin_1");
        zeppelinAnimations[1] = getAnimation(getZeppelinAnim2,"Zeppelin_2");
        ActiveItems.push(createMotionItem2(zeppelin[0], zeppelin[1],
                                           zeppelinAnimations[0][0], zeppelinAnimations[0][1],
                                           tweetOffset));
        ActiveItems.push(createMotionItem2(zeppelin[0], zeppelin[1],
                                           zeppelinAnimations[1][0], zeppelinAnimations[1][1],
                                           tweetOffset));


        tweetOffset = [0, -10, 0];
        var balloons = createBalloons();
        var balloonAnimations = [];
        balloonAnimations[0] = getAnimation(getBalloonAnim1,"HeliumBalloons_1");
        balloonAnimations[1] = getAnimation(getBalloonAnim2,"HeliumBalloons_2");
        ActiveItems.push(createMotionItem2(balloons[0], balloons[1],
                                           balloonAnimations[0][0],balloonAnimations[0][1],
                                           tweetOffset));
        ActiveItems.push(createMotionItem2(balloons[0], balloons[1],
                                           balloonAnimations[1][0],balloonAnimations[1][1],
                                           tweetOffset));


        tweetOffset = [0, -27, 0];
        var airballoon = createAirBalloon();
        var airballoonAnimations = [];
        airballoonAnimations[0] = getAnimation(getAirballoonAnim1,"Balloon_1");
        airballoonAnimations[1] = getAnimation(getAirballoonAnim2,"Balloon_2");
        ActiveItems.push(createMotionItem2(airballoon[0],airballoon[1],
                                           airballoonAnimations[0][0], airballoonAnimations[0][1],
                                           tweetOffset));
        ActiveItems.push(createMotionItem2(airballoon[0],airballoon[1],
                                           airballoonAnimations[1][0], airballoonAnimations[1][1],
                                           tweetOffset));

        tweetOffset = [0, -10, 0];
        var ufo = createUFO();
        var ufoAnimations = [];
        ufoAnimations[0] = getAnimation(getUfoAnim1,"UFO_1");
        ufoAnimations[1] = getAnimation(getUfoAnim2,"UFO_2");

        ActiveItems.push(createMotionItem2(ufo[0], ufo[1],
                                           ufoAnimations[0][0], ufoAnimations[0][1],
                                           tweetOffset));
        ActiveItems.push(createMotionItem2(ufo[0], ufo[1],
                                           ufoAnimations[1][0], ufoAnimations[1][1],
                                           tweetOffset));


        for (var i = 0,l =ActiveItems.length; i < l; i++) {
            grp.addChild(ActiveItems[i]);
        }
    }

    var cameraManager = new CameraManger(switchManipulator, ActiveItems);
    CameraManager = cameraManager;

    //viewer.getManipulator().setNode(statue);
    orbitManipulator.setTarget([0, 0, 24.0]);
    orbitManipulator.setDistance(150);
    orbitManipulator.setMinDistance(100);
    orbitManipulator.setMaxDistance(450);

    viewer.getCamera().setComputeNearFar(false);
    var aspectRatio = canvas.width/canvas.height;

    viewer.getCamera().setProjectionMatrix(osg.Matrix.makePerspective(50, aspectRatio, 0.1, 2500, []));

    var cameraInverseUniform = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]),'CameraInverseMatrix');
    viewer.getCamera().getOrCreateStateSet().addUniform(cameraInverseUniform);

    var position0 = osg.Uniform.createFloat3([100.0,0.0, 100.0],"position0");
    var scale0 = osg.Uniform.createFloat3(osg.Vec3.mult([0.3, 1.0, 0.2], 10.0, []),"scale0");
    var radius0 = osg.Uniform.createFloat1(40.0, "radius0");
    var cameraStateSet = viewer.getCamera().getOrCreateStateSet();
    cameraStateSet.addUniform(position0);
    cameraStateSet.addUniform(scale0);
    cameraStateSet.addUniform(radius0);
    cameraStateSet.addUniform(cameraInverseUniform);

    var Main = function () { };
    Main.prototype = {
        update: function (node, nv) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            // position interpolation
            osg.Vec3.lerp((currentTime/30.0) % 1.0 , 
                          [400.0, 400.0, 100.0], 
                          [-400.0, -400.0, 100.0], 
                          position0.get());
            position0.dirty();

            osg.Vec3.lerp( Math.sin(Math.PI*((currentTime/30.0) % 1.0)) , 
                          [2, 3.0, 2.0],
                          [5.5, 5.0, 2.0],
                          scale0.get());
            //osg.log(scale0.get());
            scale0.dirty();
            return true;
        }
    };
    grp.setUpdateCallback(new Main());
    var rootNode = new osg.Node();

    if (false) {
        var clouds = createSphere();
        var CloudUpdateCallback = function() {
            this.update = function(node, nv) {
                var pos = position0.get();
                pos = [0,0,100];
                var mpos = osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], [] );
                var scale = scale0.get();
                scale = [3,3,1.5];
                var radius = radius0.get()[0];
                radius = 40.0;
                var mscale = osg.Matrix.makeScale(scale[0] * radius, scale[1] * radius, scale[2] * radius, []);
                osg.Matrix.mult(mpos, mscale, node.getMatrix());
                return true;
            };
        };
        var cloudUpdate = new CloudUpdateCallback();
        clouds.setUpdateCallback(cloudUpdate);

        var clouds2 = createSphere2();
        clouds2.setUpdateCallback(cloudUpdate);


        var rtt = createRTT(grp, [ window.innerWidth,
                                   window.innerHeight ], 
                            clouds );
        var blur = blurTexture(rtt.renderedTexture, clouds2);
        var debugRTT = createDebugRTT(blur);
        //var debugRTT = createDebugRTT(rtt);

        rootNode.addChild(rtt);
        rootNode.addChild(blur);
        //rootNode.addChild(grp);
        rootNode.addChild(renderCloud(rtt.renderedTexture, blur, grp));
        rootNode.addChild(debugRTT);

    }
    rootNode.addChild(grp);


    addCloud(grp);

    switchManipulator.getInverseMatrix = function() {
        var matrix = osgGA.SwitchManipulator.prototype.getInverseMatrix.call(this);
        
        var inv = [];
        osg.Matrix.inverse(matrix, inv);
        cameraInverseUniform.set(inv);
        //osg.log(inv);
        return matrix;
    };
    

    viewer.setSceneData(rootNode);
    viewer.getManipulator().computeHomePosition();
    viewer.run();
  

    var switchCamera = function(event) {
        var cameraKey = 67; // c key;
        if (event && event.keyCode === cameraKey) {
            cameraManager.nextCamera();
        }
    };
    window.addEventListener("keyup", switchCamera, false);

};



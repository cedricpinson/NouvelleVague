/** -*- compile-command: "jslint-cli main.js" -*-
*/
var EnableTweaking = true;
var CameraVehicles = { 
    'plane': {
        'translate' : [-30, 19.5, 0],
        'rotate' : [0,0,0],
        'tweetRotate' : 0,
        'name' : "plane" },
    'ufo': {
        'translate' : [-30, 7.9, 5.3],
        'rotate' : [0,-0.16,0],
        'tweetRotate' : 0.43,
        'name' : "ufo" },
    'zeppelin': {
        'translate' : [-30, 7.4, 13.2],
        'rotate' : [0.14,0,-0.06],
        'tweetRotate' : 0,
        'name' : "zeppelin" },
    'airballoon': {
        'translate' : [-30, 7.9, -29.5],
        'rotate' : [0, 0.44,0],
        'tweetRotate' : 2.86,
        'name' : "airballoon" },
    'balloon': {
        'translate' : [-30, 10.5, 1.1],
        'rotate' : [0.14,0,0],
        'tweetRotate' : 0.54,
        'name' : "balloon" }
};

var ItemTimingParameters = { 
    'Biplane_1': {
        'tweet' : 5.0,
        'invalid' : 7.9,
        'cameraCut': 5.3
    },
    'Biplane_2': {
        'tweet' : 3.10,
        'invalid' : 8.1,
        'cameraCut': 3.8
    },
    'Biplane_3': {
        'tweet' : 4.5,
        'invalid' : 7.7,
        'cameraCut': 4.6
    },
    'UFO_1': {
        'tweet' : 5.0,
        'invalid' : 7.2,
        'cameraCut': 7.0
    },
    'UFO_2': {
        'tweet' : 3.0,
        'invalid' : 9.0,
        'cameraCut': 7.3
    },
    'HeliumBalloons_1': {
        'tweet' : 14.0,
        'invalid' : 32.1,
        'cameraCut': 23.9
    },
    'HeliumBalloons_2': {
        'tweet' : 20.0,
        'invalid' : 35.1,
        'cameraCut': 22.0
    },
    'Balloon_1': {
        'tweet' : 30.0,
        'invalid' : 45.0,
        'cameraCut': 36.0
    },
    'Balloon_2': {
        'tweet' : 30.0,
        'invalid' : 45.0,
        'cameraCut': 36.0
    },
    'Zeppelin_1': {
        'tweet' : 21.0,
        'invalid' : 39.8,
        'cameraCut': 28.0
    },
    'Zeppelin_2': {
        'tweet' : 21.0,
        'invalid' : 39.8,
        'cameraCut': 28.0
    }
};

var RenderingParameters = {
    'envmapReflection': 0.65,
    'envmapReflectionStatue': 1.35,
    'envmapReflectionCircle': 1.0,
    'shadowAltitudeRange': 220,
    'shadowAltitudeMin': 14
};
var Ribbons = undefined;
var Intro = true;
var Demo = false;
var StartToReleaseTweet = true;

window.addEventListener("load", function() {
    loadModels();
    //start();
}, true );

var Viewer = undefined;
var OrbitManipulator = undefined;
var changeCameraAngle = undefined;

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

var cameraManager = undefined;
var twitterManager = undefined;


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


var FindAnimationManagerVisitor = function() { 
    osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN); 
    this._cb = undefined;
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

        var world = node.sourceNode.getWorldMatrices()[0];
        var trans = [];
        osg.Matrix.getTrans(world, trans);

        var st = node.getOrCreateStateSet();
        var uniform = st.getUniform('altitude');
        if (!uniform) {
            uniform = osg.Uniform.createFloat1(1.0, 'altitude');
            st.addUniform(uniform);
        }
        var alt = Math.max(0.0,trans[2]-RenderingParameters.shadowAltitudeMin);
        uniform.get()[0] = 1.0-Math.min(1.0,(alt/RenderingParameters.shadowAltitudeRange));
        uniform.dirty();

        return true;
    };
};

var createSlider = function(conf) {
    var obj = conf;
    var createFunc = function(index, object, name, field) {
        var o = object;
        var n = name;
        var i = index;
        var f = field;
        var func = function(value) {
            var rvalue = value;
            if (typeof(value) !== "number") {
                value = this.value;
                rvalue = parseFloat(value);
            }
            document.getElementById(n).innerHTML = value;
            o[f][i] = rvalue;
            var id = o.name + "_" + n;
            
            osg.log("store " + id + " " + value);
            window.localStorage.setItem(id, value);
        };
        return func;
    };

    var translateX = createFunc(0, obj, "CameraTranslateX", "translate");
    var translateY = createFunc(1, obj, "CameraTranslateY", "translate");
    var translateZ = createFunc(2, obj, "CameraTranslateZ", "translate");

    var rotateX = createFunc(0, obj, "CameraRotateX", "rotate");
    var rotateY = createFunc(1, obj, "CameraRotateY", "rotate");
    var rotateZ = createFunc(2, obj, "CameraRotateZ", "rotate");

    var callback = {
        'translateX' : translateX,
        'translateY' : translateY,
        'translateZ' : translateZ,
        'rotateX' : rotateX,
        'rotateY' : rotateY,
        'rotateZ' : rotateZ
    };
    conf.changeValue = callback;
};

var CameraOffsetRotation = function() {
    this._reset = false;
    this._pos = [0, 0];
    this._cumulated = [0, 0];
};

CameraOffsetRotation.prototype = {
    mouseMove: function(ev) {
        if (this._mouseDown) {
            var pos = osgGA.Manipulator.prototype.getPositionRelativeToCanvas(ev);

            this._cumulated [0] += pos[0] - this._pos[0];
            this._cumulated [1] += pos[1] - this._pos[1];

            this._pos[0] = pos[0];
            this._pos[1] = pos[1];
        }
    },
    mouseDown: function(ev) {
        this._mouseDown = true;
        var pos = osgGA.Manipulator.prototype.getPositionRelativeToCanvas(ev);
        this._pos[0] = pos[0];
        this._pos[1] = pos[1];
    },
    mouseUp: function(ev) {
        this._mouseDown = false;
    },
    reset: function() {
        this._cumulated [ 0 ] = 0;
        this._cumulated [ 1 ] = 0;
        this._reset = true;
    },

    getMatrix: function() {
        var x = this._cumulated[0];
        var y = this._cumulated[1];
        var rs = 200;
        var my = osg.Matrix.makeRotate(-y/rs, 1,0,0, []);
        var mx = osg.Matrix.makeRotate(x/rs, 0,1,0, []);
        osg.Matrix.preMult(mx, my);
        return mx;
    }
};

var createItemCameraTransform = function(config) {
    var root = new osg.MatrixTransform();
    var conf = config;
    var changeValue = conf.changeValue;
    if (changeValue === undefined) {
        createSlider(conf);
    }

    var UpdateCamera = function(conf) {
        this.conf = conf;
        if (conf.name === 'balloon' || conf.name === 'zeppelin' || conf.name === 'airballoon' ) {
            var canvas = document.getElementById('3DView');
            var camOffset = new CameraOffsetRotation();
            this.conf.cameraOffset = camOffset;
            canvas.addEventListener("mousemove", function(ev) { 
                camOffset.mouseMove(ev);
            }, false);
            canvas.addEventListener("mousedown", function(ev) { 
                camOffset.mouseDown(ev);
            }, false);
            canvas.addEventListener("mouseup", function(ev) { 
                camOffset.mouseUp(ev);
            }, false);
        }

        this.update = function(node, nv) {
            var translate = conf.translate;
            var matrixTranslate = [];
            osg.Matrix.makeTranslate(translate[0], translate[1], translate[2], matrixTranslate);

            osg.Matrix.preMult(matrixTranslate, osg.Matrix.makeRotate(Math.PI/2, 0, 1, 0, []));

            var matrixRotateX = [];
            osg.Matrix.makeRotate(this.conf.rotate[0], 1,0,0, matrixRotateX);

            var matrixRotateY = [];
            osg.Matrix.makeRotate(this.conf.rotate[1], 0,1,0, matrixRotateY);

            var matrixRotateZ = [];
            osg.Matrix.makeRotate(this.conf.rotate[2], 0,0,1, matrixRotateZ);

            var matrix = node.getMatrix();
            osg.Matrix.mult(matrixTranslate, matrixRotateZ, matrix);
            osg.Matrix.preMult(matrix, matrixRotateX);
            osg.Matrix.preMult(matrix, matrixRotateY);

            if (node.needToCameraCut() === true) {
                var world = node.getParents()[0].getWorldMatrices()[0];
                var pos = [];
                osg.Matrix.getTrans(world, pos);
                var inv = [];
                osg.Matrix.inverse(world, inv);
                var lookat = [];
                osg.Matrix.makeLookAt(pos, [0,0,0], [0,0,1], lookat);
                osg.Matrix.inverse(lookat, matrix);
                osg.Matrix.postMult(inv, matrix);
                if (this.conf.name === 'balloon') {
                    osg.Matrix.preMult(matrix, osg.Matrix.makeTranslate(0,0,-15, []));
                }
            }

            if (Intro === false && this.conf.cameraOffset) {
                osg.Matrix.preMult(matrix, this.conf.cameraOffset.getMatrix() );
            }
            
            return true;
        };
    };
    root.conf = conf;
    root.setUpdateCallback(new UpdateCamera(conf));
    return root;
};


var createMotionItem2 = function(node, shadow, anim, child, posTweetOffset, plane, cameraConf, cameraNode) {

    var ItemPlace = [
        0, 5, 8, 3, 9, 1, 6, 7, 2, 4, 10
    ];


    var UFORemoveRotation = function() {};
    UFORemoveRotation.prototype = {
        update: function(node, nv) {
            var matrix = node.parentNode.getMatrix();
            var inv = [];
            osg.Matrix.inverse(matrix, inv);
            var trans = [];
            osg.Matrix.getTrans(matrix, trans);
            osg.Matrix.preMult(inv, osg.Matrix.makeTranslate(trans[0], trans[1], trans[2], []));
            osg.Matrix.mult(inv, node.rotationMatrix, node.getMatrix());
            //osg.Matrix.copy(inv, node.getMatrix());
            return true;
        }
    };

    var extendItem = function(name, item, anim, tweetCallback, camera) {

        var finder = new FindAnimationManagerVisitor();
        anim.accept(finder);
        var animationManager = finder._cb;
        var lv = new osgAnimation.LinkVisitor();
        lv.setAnimationMap(animationManager.getAnimationMap());
        anim.accept(lv);
        animationManager.buildTargetList();
        var firstAnim = Object.keys(animationManager.getAnimationMap())[0];

        item.setNodeMask(0);
        item.animationManager = animationManager;
        item.anim = firstAnim;
        item.animObject = animationManager.getAnimationMap()[firstAnim];
        item.tweetCallback = tweetCallback;
        item.notAvailable = false;

        item.makeUnavailable = function() {
            this.notAvailable = true;
            var self = this;
            var delay = (1.0 + (Math.random() * 0.25) ) * this.animObject.getDuration();
            setTimeout( function() {
                self.notAvailable = false;
            }, delay*1000);
        };
        item.isAvailable = function() {
            return (this.notAvailable !== true);
        };

        item.animationOption = { 'name': firstAnim,
                                 'loop': 1
                               };

        item.getPercentOfAnimation = function() {
            return item.animationOption.currentTime/ item.animationOption.duration;
        };
        var animationCallback = function( t) {
            item.animationOption.currentTime = t;

            var itemParameter = ItemTimingParameters[item.anim];
            var tweetTime = itemParameter.tweet;
            var invalidTime = itemParameter.invalid;

            if (t > tweetTime) {
                item.tweetCallback.transition();
            }
            item.canChangeCamera = false;
            if (t > invalidTime) {
                item.canChangeCamera = true;
            }
        };
        camera.needToCameraCut = function() {
            if (item.animationOption.currentTime > ItemTimingParameters[firstAnim].cameraCut) {
                return true;
            }
            return false;
        };

        item.animationOption.callback = animationCallback;


        item.runTweet = function(tweet) {
            this.makeUnavailable();
            this.setNodeMask(~0x0);
            this.tweetCallback.addTweet(tweet);
            this.animationManager.playAnimation(this.animationOption);
        };

        if (EnableTweaking && document.getElementById('Parameters') !== null) {
            var domTarget = document.getElementById('Parameters');
            osgUtil.ParameterVisitor.createSlider(firstAnim+"CameraCut", 
                                                  firstAnim+"CameraCut",
                                                  ItemTimingParameters[firstAnim],
                                                  'cameraCut',
                                                  ItemTimingParameters[firstAnim].cameraCut,
                                                  0.0,
                                                  item.animObject.getDuration(),
                                                  0.1, domTarget);

            osgUtil.ParameterVisitor.createSlider(firstAnim+"CameraInvalid", 
                                                  firstAnim+"CameraInvalid",
                                                  ItemTimingParameters[firstAnim],
                                                  'invalid',
                                                  ItemTimingParameters[firstAnim].invalid,
                                                  0.0,
                                                  item.animObject.getDuration(),
                                                  0.1, domTarget);
        }
    };

    if (createMotionItem2.item === undefined) {
        createMotionItem2.item = 0;
    }

    var wayTransform = new osg.MatrixTransform();
    var offset = osg.Matrix.makeTranslate(OffsetPosition[0], OffsetPosition[1], OffsetPosition[2],[]);
    osg.Matrix.postMult(osg.Matrix.makeRotate(2.0*Math.PI/11.0 * ItemPlace[createMotionItem2.item], 0,0,1, []), offset);
    wayTransform.setMatrix(offset);

    
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

    var camera = createItemCameraTransform(cameraConf);
    if (node.getName() === 'balloon' && cameraNode !== undefined) {
        var rot = new osg.MatrixTransform();
        var mr = createRotationMatrix();
        var mr2 = osg.Matrix.makeRotate(Math.PI/2*1.25, 0,0,1, []);
        osg.Matrix.postMult(mr2, mr);
        rot.setMatrix(mr);
        cameraNode.addChild(rot);
        rot.addChild(camera);
    } else {
        tweet.addChild(camera);
    }

    camera.setName("CameraPosition");


    if (node.getName() === 'ufo') {
        var removeRotation = new osg.MatrixTransform();
        removeRotation.rotationMatrix = createRotationMatrix();
        removeRotation.parentNode = child;
        child.addChild(removeRotation);
        removeRotation.addChild(tweet);
        removeRotation.addUpdateCallback(new UFORemoveRotation());
    } else {
        itemRoot.addChild(tweet);
    }


    var tweetOffset = osg.Matrix.makeIdentity([]);
    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,1,0, []));
    osg.Matrix.postMult(osg.Matrix.makeTranslate(posTweetOffset[0], posTweetOffset[1], posTweetOffset[2], []), tweetOffset);

    tweet.setMatrix(tweetOffset);

    var tweetText = { text: "Welcome to Nouvelle Vague! We are approaching the tweets airport.",
                      from_user: "ultranoir",
                      created_at: new Date().toString()
                    };

    var onlyTweetRendering;
    if (node.getName() === 'airballoon' || node.getName() === 'ufo' || node.getName() === 'balloon' ) {
        onlyTweetRendering = new osg.MatrixTransform();

        if (EnableTweaking && document.getElementById('Parameters') !== null) {
            if (CameraVehicles[node.getName()].tweetRotateUpdateCallback === undefined) {
                var domTarget = document.getElementById('Parameters');
                osgUtil.ParameterVisitor.createSlider(node.getName()+"TweetAngle", 
                                                      node.getName()+"_tweetAngle",
                                                      CameraVehicles[node.getName()],
                                                      'tweetRotate',
                                                      CameraVehicles[node.getName()].tweetRotate,
                                                      -Math.PI,
                                                      Math.PI,
                                                      0.01, domTarget);
                var TweetRotationUpdateCallback = function(name) {
                    this.name = name;
                };
                TweetRotationUpdateCallback.prototype = {
                    update: function(node, nv) {
                        var value = CameraVehicles[this.name].tweetRotate;
                        node.setMatrix(osg.Matrix.makeRotate(value, 0,1,0, []));
                        return true;
                    }
                };
                CameraVehicles[node.getName()].tweetRotateUpdateCallback = new TweetRotationUpdateCallback(node.getName());
            }
            onlyTweetRendering.addUpdateCallback(CameraVehicles[node.getName()].tweetRotateUpdateCallback);
        }
        onlyTweetRendering.setMatrix(osg.Matrix.makeRotate(CameraVehicles[node.getName()].tweetRotate, 0,1,0, []));
    } else {
        onlyTweetRendering = new osg.Node();
    }

    tweet.addChild(onlyTweetRendering);

    var tweetGenerated = createTweetModel(tweetText);
    var texture = tweetGenerated[1];
    var tweetModel = tweetGenerated[0];
    onlyTweetRendering.setStateSet(getOrCreateTweetStateSet());

    var tweetCallback = new TweetUpdateCallback(tweetModel);
    onlyTweetRendering.addChild(tweetModel);
    onlyTweetRendering.addUpdateCallback(tweetCallback);

    extendItem(node.getName(), wayTransform, anim, tweetCallback, camera);
    wayTransform.addChild(anim);
    wayTransform.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0, 'override'));

    createMotionItem2.item += 1;

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
        texture.setTextureSize(4096/2, 64/2);
        texture.setMinFilter(osg.Texture.LINEAR_MIPMAP_LINEAR);
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

        //var dt = (t - this._lastUpdate) * 0.02;
        var dt = (t - this._lastUpdate) * 0.04;
        var limit = 1.0;

        for (var i = 0, l = 2; i < l; i++) {
            var ribbonTime = this._ribbonsTime[i];
            var unit = this._ribbonsUnit[i];
            var tr0 = ribbonTime + dt;
            if (tr0 > (limit + unit)) {
                
                //osg.log(this._tweetList);
                if (this._tweetList.length > 0) {
                    //osg.log(tr0.toString()  + " add tweet " + this._tweetList[0].text + " on unit " + unit);
                }
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
        if (this._tweetList.length > 200) {
            return;
        }
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
            tweet = this._tweetList.shift();
            //tweet = this._tweetList.splice(0,1)[0];
        } else {
            tweet = this._ribbonsText[index][(unit+1)%2];
            osg.log("warning no tweet in ribbon on unit " + unit + " used a previous one, ( " + tweet.text + " )");
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
    var UpdateCallbackCloud = function() {};
    UpdateCallbackCloud.prototype = {
        update: function(node, nv) {
            var t = nv.getFrameStamp().getSimulationTime();
            var rotate = [];
            osg.Matrix.makeRotate(t*0.008, 0,0,1, rotate);
            osg.Matrix.preMult(rotate,
                               osg.Matrix.makeTranslate(node.cloudPosition[0],
                                                        node.cloudPosition[1],
                                                        node.cloudPosition[2], []));
            // rotate around scene
            node.setMatrix(rotate);
            return true;
        }
    };

    var callback = new UpdateCallbackCloud();
    var index = 0;
    var instanceCloud = function(grp, x, y, z) {
        var cloudsBillboard = createCloud("CloudInstance" + index.toString(), (index+1) * 5);
        index++;
        cloudsBillboard.setMatrix(osg.Matrix.makeTranslate(x,y,z, [] ));
        grp.addChild(cloudsBillboard);
        cloudsBillboard.cloudPosition = [x, y, z];
        cloudsBillboard.addUpdateCallback(callback);
    };

    instanceCloud(grp, 300, 150, 60);
    instanceCloud(grp, -260, 100, 80);
    instanceCloud(grp, 50, -100, 100);
};

var LastUserEventTime;
var startDemoMode = function() {
    osg.log("start demo mode");
    Demo = true;
};
var stopDemoMode = function() {
    if (Demo === false) {
        return;
    }
    LastUserEventTime = (new Date()).getTime();
    Demo = false;
    osg.log("stop demo mode");
};

var setupIntro = function()
{
    var tweetIntro = { text: "Welcome to Nouvelle Vague!                                         We are approaching the tweets airport.",
                       from_user: "ultranoir",
                       created_at: new Date().toString()
                     };

    var cameraIndexes = [];
    cameraManager.getCameraOfType('zeppelin',cameraIndexes);
    itemIntro = cameraManager.itemList[cameraIndexes[0]];
    twitterManager.processTweetOnItem(itemIntro, tweetIntro);
    cameraManager.nextCamera(cameraIndexes[0]);
    sendCameraChange('zeppelin');
    twitterManager.setRate(0.8);
    var duration = 24;
    var durationIntroEnd = 30;
    setTimeout(function() {
        switchCamera('default');
        sendCameraChange('default');
    }, duration*1000);

    setTimeout(function() {
        osg.log("intro finished");
        Intro = false;
    }, durationIntroEnd*1000);

    setTimeout(function() {
        osg.log("restore full tweet rate");
        twitterManager.setRate(100.0);
    }, (durationIntroEnd+10)*1000);


};


var start = function() {
    //osg.ReportErrorGL = true;

    // all texture will use mipmap
    var previousDefaultTextureParameters = osg.Texture.prototype.setDefaultParameters;
    osg.Texture.prototype.setDefaultParameters = function() {
        previousDefaultTextureParameters.call(this);
        this.setMinFilter(osg.Texture.LINEAR_MIPMAP_LINEAR);
    };


    if ( EnableTweaking === false) {
        var domParameters = document.getElementById('Parameters');
        if (domParameters !== null) {
            domParameters.style.display = 'none';
        }
        var domParametersCamera = document.getElementById('ParametersCamera');
        if (domParametersCamera !== null) {
            domParametersCamera.style.display = 'none';
        }
    }



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
        if (window.addMusicCtrl === undefined) {
            playMusic();
        }
    }

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

    viewer.update = function() {
        osgViewer.Viewer.prototype.update.call(this);
        if (this.getManipulator()) {
            osg.Matrix.copy(this.getManipulator().getInverseMatrix(), this.getCamera().getViewMatrix());
        }
    };

    Viewer = viewer;

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
    viewer.getCamera().setClearMask(osg.Camera.DEPTH_BUFFER_BIT);

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
    Ribbons = new TweetRibbon(statue);

    Ribbons.addTweet({ text: "UltraNoir" });
    Ribbons.addTweet({ text: "UltraNoir" });

    grp.addChild(statue);

    if (true) {
        var plane = createPlane();
        var planeAnimations = [];
        planeAnimations[0] = getAnimation(getPlaneAnim1,"Biplane_1");
        planeAnimations[1] = getAnimation(getPlaneAnim2,"Biplane_2");
        planeAnimations[2] = getAnimation(getPlaneAnim3,"Biplane_3");

        var tweetOffset = [0, -10, 0];
        var tweetRotation = [0, 0, 0];
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[0][0], planeAnimations[0][1],
                                           tweetOffset, true,
                                           CameraVehicles['plane']
                                          ));
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[1][0], planeAnimations[1][1],
                                           tweetOffset, true,
                                           CameraVehicles['plane']
                                          ));
        ActiveItems.push(createMotionItem2(plane[0], plane[1], 
                                           planeAnimations[2][0], planeAnimations[2][1],
                                           tweetOffset, true,
                                           CameraVehicles['plane']
                                          ));

        tweetOffset = [0, -27, 7];
        tweetRotation = [0, 0, 0];
        var zeppelin = createZeppelin();
        var zeppelinAnimations = [];
        zeppelinAnimations[0] = getAnimation(getZeppelinAnim1,"Zeppelin_1");
        zeppelinAnimations[1] = getAnimation(getZeppelinAnim2,"Zeppelin_2");
        ActiveItems.push(createMotionItem2(zeppelin[0], zeppelin[1],
                                           zeppelinAnimations[0][0], zeppelinAnimations[0][1],
                                           tweetOffset,false,
                                           CameraVehicles['zeppelin']));
        ActiveItems.push(createMotionItem2(zeppelin[0], zeppelin[1],
                                           zeppelinAnimations[1][0], zeppelinAnimations[1][1],
                                           tweetOffset,false,
                                           CameraVehicles['zeppelin']));


        tweetOffset = [0, -10, 0];
        tweetRotation = [0, 0, 0];
        var balloons = createBalloons();
        var balloonAnimations = [];
        balloonAnimations[0] = getAnimation(getBalloonAnim1,"HeliumBalloons_1");
        balloonAnimations[1] = getAnimation(getBalloonAnim2,"HeliumBalloons_2");

        var nvanimCam1 = new FindNodeVisitor('HeliumBalloonsCam_1');
        balloonAnimations[0][0].accept(nvanimCam1);
        var animCam1 = nvanimCam1.found[0];

        var nvanimCam2 = new FindNodeVisitor('HeliumBalloonsCam_2');
        balloonAnimations[1][0].accept(nvanimCam2);
        var animCam2 = nvanimCam2.found[0];


        ActiveItems.push(createMotionItem2(balloons[0], balloons[1],
                                           balloonAnimations[0][0],balloonAnimations[0][1],
                                           tweetOffset,false,
                                           CameraVehicles['balloon'], animCam1
                                          ));
        ActiveItems.push(createMotionItem2(balloons[0], balloons[1],
                                           balloonAnimations[1][0],balloonAnimations[1][1],
                                           tweetOffset,false,
                                           CameraVehicles['balloon'], animCam2
                                          ));


        tweetOffset = [0, -27, 0];
        tweetRotation = [0, 0, 0];
        var airballoon = createAirBalloon();
        var airballoonAnimations = [];
        airballoonAnimations[0] = getAnimation(getAirballoonAnim1,"Balloon_1");
        airballoonAnimations[1] = getAnimation(getAirballoonAnim2,"Balloon_2");
        ActiveItems.push(createMotionItem2(airballoon[0],airballoon[1],
                                           airballoonAnimations[0][0], airballoonAnimations[0][1],
                                           tweetOffset,false,
                                           CameraVehicles['airballoon']));
        ActiveItems.push(createMotionItem2(airballoon[0],airballoon[1],
                                           airballoonAnimations[1][0], airballoonAnimations[1][1],
                                           tweetOffset,false,
                                           CameraVehicles['airballoon']));

        tweetOffset = [0, -10, 0];
        tweetRotation = [0, 0, 0];
        var ufo = createUFO();
        var ufoAnimations = [];
        ufoAnimations[0] = getAnimation(getUfoAnim1,"UFO_1");
        ufoAnimations[1] = getAnimation(getUfoAnim2,"UFO_2");

        ActiveItems.push(createMotionItem2(ufo[0], ufo[1],
                                           ufoAnimations[0][0], ufoAnimations[0][1],
                                           tweetOffset, false,
                                           CameraVehicles['ufo']));
        ActiveItems.push(createMotionItem2(ufo[0], ufo[1],
                                           ufoAnimations[1][0], ufoAnimations[1][1],
                                           tweetOffset,false,
                                           CameraVehicles['ufo']));


        for (var i = 0,l =ActiveItems.length; i < l; i++) {
            grp.addChild(ActiveItems[i]);
        }
    }

    if (twitterManager === undefined) {
        twitterManager = new TweetManager(ActiveItems);
    } else {
        twitterManager.setItemList(ActiveItems);
    }
    cameraManager = new CameraManager(switchManipulator, ActiveItems);

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

    LastUserEventTime = (new Date()).getTime();

    var firstFrame = true;
    var Main = function () { };
    Main.prototype = {
        update: function (node, nv) {
            var currentTime = nv.getFrameStamp().getSimulationTime();
            if (firstFrame) {
                // intro setup
                setupIntro();
                firstFrame = false;
            }

            var st = node.getOrCreateStateSet();
            var envmapReflectionStatue = st.getUniform('envmapReflectionStatue');
            var envmapReflection = st.getUniform('envmapReflection');
            var envmapReflectionCircle = st.getUniform('envmapReflectionCircle');

            if ( envmapReflectionStatue === undefined) {
                envmapReflectionStatue = osg.Uniform.createFloat1(1.0, 'envmapReflectionStatue');
                envmapReflection = osg.Uniform.createFloat1(1.0, 'envmapReflection');
                envmapReflectionCircle = osg.Uniform.createFloat1(1.0, 'envmapReflectionCircle');
                st.addUniform(envmapReflection);
                st.addUniform(envmapReflectionStatue);
                st.addUniform(envmapReflectionCircle);

                if (EnableTweaking && document.getElementById('Parameters') !== null) {

                    var domTarget = document.getElementById('Parameters');
                    osgUtil.ParameterVisitor.createSlider('envmapReflection', 
                                                          'envmapReflection',
                                                          RenderingParameters,
                                                          'envmapReflection',
                                                          RenderingParameters.envmapReflection,
                                                          0.0,
                                                          2.0,
                                                          0.01, domTarget);
                    osgUtil.ParameterVisitor.createSlider('envmapReflectionStatue', 
                                                          'envmapReflectionStatue',
                                                          RenderingParameters,
                                                          'envmapReflectionStatue',
                                                          RenderingParameters.envmapReflectionStatue,
                                                          0.0,
                                                          2.0,
                                                          0.01, domTarget);

                    osgUtil.ParameterVisitor.createSlider('envmapReflectionCircle', 
                                                          'envmapReflectionCircle',
                                                          RenderingParameters,
                                                          'envmapReflectionCircle',
                                                          RenderingParameters.envmapReflectionCircle,
                                                          0.0,
                                                          2.0,
                                                          0.01, domTarget);

                    osgUtil.ParameterVisitor.createSlider('shadowAltitudeRange', 
                                                          'shadowAltitudeRange',
                                                          RenderingParameters,
                                                          'shadowAltitudeRange',
                                                          RenderingParameters.shadowAltitudeRange,
                                                          1.0,
                                                          300.0,
                                                          1.0, domTarget);

                    osgUtil.ParameterVisitor.createSlider('shadowAltitudeMin', 
                                                          'shadowAltitudeMin',
                                                          RenderingParameters,
                                                          'shadowAltitudeMin',
                                                          RenderingParameters.shadowAltitudeMin,
                                                          1.0,
                                                          100.0,
                                                          1.0, domTarget);
                    
                }
            }
            envmapReflectionCircle.get()[0] = RenderingParameters.envmapReflectionCircle;
            envmapReflectionCircle.dirty();
            envmapReflectionStatue.get()[0] = RenderingParameters.envmapReflectionStatue;
            envmapReflectionStatue.dirty();
            envmapReflection.get()[0] = RenderingParameters.envmapReflection;
            envmapReflection.dirty();


            if (!Intro) {
                twitterManager.update();
                cameraManager.manageCameraSwitching();
            }

            if (Demo === false) {
                if (!cameraManager.isMainViewActive()) {
                    LastUserEventTime = (new Date()).getTime();
                }
                var MaxTimeDemo = 20.0;
                if (currentTime - (LastUserEventTime/1000.0 - nv.getFrameStamp().getReferenceTime()) > MaxTimeDemo) {
                    if (cameraManager.isMainViewActive() && Intro === false) {
                        startDemoMode();
                    }
                }
            }


            if (EnableTweaking) {
                if (this.animationTimeDomElement === undefined) {
                    this.animationTimeDomElement = document.getElementById("AnimationTime");
                }
                if (this.animationTimeDomElement) {
                    var t = -1;
                    if (!cameraManager.isMainViewActive()) {
                        var camItem = cameraManager.itemList[cameraManager.current].animationOption;
                        if (camItem.currentTime) {
                            t = camItem.currentTime;
                        }
                    }
                    this.animationTimeDomElement.innerHTML = "animation time " + t.toString();
                }
            }


            return true;
        }
    };
    window.addEventListener("mousemove", function() {
        LastUserEventTime = (new Date()).getTime();
        if (Demo === true) {
            osg.log("mousemove");
            cameraManager.mainView();
            sendCameraChange('default');
        }
        stopDemoMode();
    }, false);

    grp.setUpdateCallback(new Main());
    var rootNode = new osg.Node();
    rootNode.addChild(grp);


    addCloud(grp);

    switchManipulator.getInverseMatrix = function() {
        var matrix = osgGA.SwitchManipulator.prototype.getInverseMatrix.call(this);
        
        var inv = [];
        osg.Matrix.inverse(matrix, inv);
        cameraInverseUniform.set(inv);

        return matrix;
    };
    

    viewer.setSceneData(rootNode);
    viewer.getManipulator().computeHomePosition();
    viewer.run();


    var eventCameraKeys = function(event) {
        var cameraKey = 67; // c key;
        var planeKey = 80; // p key;
        var zeppelinKey = 90; // z key;
        var balloonKey = 66;
        var airballoonKey = 65;
        var ufoKey = 85;
        var spaceKey = 32;
        var enterKey = 13;
        if (event.keyCode === cameraKey) {
            cameraManager.nextCamera();
        } else if (event.keyCode === planeKey) {
            switchCamera('plane');
        } else if (event.keyCode === zeppelinKey) {
            switchCamera('zeppelin');
        } else if (event.keyCode === balloonKey) {
            switchCamera('balloon');
        } else if (event.keyCode === airballoonKey) {
            switchCamera('airballoon');
        } else if (event.keyCode === ufoKey) {
            switchCamera('ufo');
        } else if (event.keyCode === spaceKey) {
            cameraManager.mainView();
            sendCameraChange('default');
            stopDemoMode();
        }
    };
    window.addEventListener("keyup", eventCameraKeys, false);

};



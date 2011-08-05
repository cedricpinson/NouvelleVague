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


var Main = function () { };
Main.prototype = {
    update: function (node, nv) {
        


        node.traverse(nv);
    }
};


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

    var scale = 0.1;
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

var createMotionItem = function(node, shadow) {

    var itemShadow = new osg.MatrixTransform();
    if (shadow) {
        itemShadow.addChild(shadow);
    }

    var itemRoot = new osg.MatrixTransform();
    var m = new MotionUpdateCallback(itemRoot, itemShadow);

    var createPath = function (h, radius) {
        if (!radius) {
            radius = 600;
        }
        var x = (Math.random()-0.5) * radius;
        var y = (Math.random()-0.5) * radius;
        var pos = [ x, y ,h ];
        return pos;
    };
    var height = 100.0;
    var z = (Math.random() * 0.5 + 0.5) * height ;

    var target = createPath(z,10.0);
    var src = createPath(z);
    
    osg.Vec3.sub(target, src, m.direction);

    m.direction = osg.Vec3.normalize(m.direction, m.direction);
    m.position = src;

    var root = new osg.Node();

    itemRoot.addChild(node);
    root.setUpdateCallback(m);

    root.addChild(itemRoot);
    root.addChild(itemShadow);


    // setup tweet offset
    var tweet = new osg.MatrixTransform();
    itemRoot.addChild(tweet);
    var tweetOffset = osg.Matrix.makeIdentity([]);
//    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,0,1, []));
    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,1,0, []));
//    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,1,0, []));
    osg.Matrix.postMult(osg.Matrix.makeTranslate(0,-30,0, []), tweetOffset);
    //var tweetOffset = osg.Matrix.makeTranslate(0,0,-15, []);
//    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(0, 0,0,1, []));
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
    return root;
};


var playMusic = function() {
    var audioSound = document.getElementById('zik');
    audioSound.play();
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
                                                preserveDrawingBuffer: false } );


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

    var main = new Main();
    var grp = new osg.Node();
    grp.setUpdateCallback(main);

    var zeppelin = createZeppelin();
    //var shadowDirigeable = createShadowDirigeable();

    var statue = createStatue();
    var balloons = createBalloons();
    var airballoon = createAirBalloon();
    var ufo = createUFO();
    var plane = createPlane();


    //grp.addChild(createSkyBox() );
    grp.addChild(createBackground() );
    grp.addChild(statue );

    ActiveItems.push(createMotionItem(plane[0], plane[1]));
    ActiveItems.push(createMotionItem(zeppelin[0], zeppelin[1]));
    ActiveItems.push(createMotionItem(airballoon[0],airballoon[1]));
    ActiveItems.push(createMotionItem(balloons[0], balloons[1]));
    ActiveItems.push(createMotionItem(ufo[0], ufo[1]));
    ActiveItems.push(createMotionItem(zeppelin[0], zeppelin[1]));
    ActiveItems.push(createMotionItem(balloons[0], balloons[1]));
    ActiveItems.push(createMotionItem(ufo[0], ufo[1]));

    var cameraManager = new CameraManger(switchManipulator, ActiveItems);

    for (var i = 0,l =ActiveItems.length; i < l; i++) {
        grp.addChild(ActiveItems[i]);
    }

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
    switchManipulator.getInverseMatrix = function() {
        var matrix = osgGA.SwitchManipulator.prototype.getInverseMatrix.call(this);
        
        var inv = [];
        osg.Matrix.inverse(matrix, inv);
        cameraInverseUniform.set(inv);
        //osg.log(inv);
        return matrix;
    };
    

    viewer.setSceneData(grp);
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



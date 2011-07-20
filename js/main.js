window.addEventListener("load", function() { start(); }, true );

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


var createMotionItem = function(node) {
    var m = new MotionUpdateCallback();

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
    var itemRoot = new osg.MatrixTransform();
    itemRoot.addChild(node);
    itemRoot.setUpdateCallback(m);

    // setup tweet offset
    var tweet = new osg.MatrixTransform();
    itemRoot.addChild(tweet);
    var tweetOffset = osg.Matrix.makeTranslate(0,0,-15, []);
    osg.Matrix.preMult(tweetOffset, osg.Matrix.makeRotate(Math.PI/2, 0,0,1, []));
    tweet.setMatrix(tweetOffset);

    //var tweetModel = osg.createTexturedBox(0,0,0, 2,2,2);
    var ratio = 1024/32;
    var textSize = 80;
    var tweetSize = [textSize,textSize/ratio];
    var tweetModel = osg.createTexturedQuad(-tweetSize[0]/2, 0, -tweetSize[1]/2,
                                           tweetSize[0], 0 ,0,
                                           0, 0 ,tweetSize[1]);
    tweet.addChild(tweetModel);

    var canvas = getCanvasText("Looking for 'Wi-Fi'ed Flights'? — Simple, useful and effective visual addition to the search results UI. blog.hipmunk.com/post/701019698… #hipmunk");
    var texture = new osg.Texture();
    texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
    texture.setFromCanvas(canvas);

//    tweetModel.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));
    tweetModel.getOrCreateStateSet().setAttributeAndMode(getTextShader());
    tweetModel.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    tweetModel.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    return itemRoot;
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

    switchManipulator.addManipulator(fpsManipulator);
    switchManipulator.addManipulator(orbitManipulator);
    switchManipulator.setManipulatorIndex(1);

    viewer.setupManipulator(switchManipulator);
    //viewer.setupManipulator(orbitManipulator);
    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);

    var main = new Main();
    var grp = new osg.Node();
    grp.setUpdateCallback(main);

    var dirigeable = createDirigeable();
    var statue = createStatue();
    var ballons = createBallons();
    var ufo = createUFO();


    //grp.addChild(createSkyBox() );
    grp.addChild(createBackground() );
    grp.addChild(statue );

    ActiveItems.push(createMotionItem(dirigeable));

    ActiveItems.push(createMotionItem(ballons));
    ActiveItems.push(createMotionItem(ufo));
    ActiveItems.push(createMotionItem(dirigeable));
    ActiveItems.push(createMotionItem(ballons));
    ActiveItems.push(createMotionItem(ufo));

    var cameraManager = new CameraManger(switchManipulator, ActiveItems);

    for (var i = 0,l =ActiveItems.length; i < l; i++) {
        grp.addChild(ActiveItems[i]);
    }

    viewer.getManipulator().setNode(statue);
    viewer.getCamera().setComputeNearFar(false);
    var aspectRatio = canvas.width/canvas.height;

    viewer.getCamera().setProjectionMatrix(osg.Matrix.makePerspective(50, aspectRatio, 0.01, 1500, []));

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



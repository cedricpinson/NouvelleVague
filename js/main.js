window.addEventListener("load", function() { start(); }, true );


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

var start = function() {

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


    viewer.init();
    viewer.setupManipulator();
//    viewer.view.setClearColor([0.0, 0.0, 0.0, 0.0]);


    var main = new Main();
    var grp = new osg.Node();
    grp.setUpdateCallback(main);

    var statue = createStatue();
    grp.addChild(createSkyBox() );
    grp.addChild(statue );

    viewer.getManipulator().setNode(statue);

    viewer.setScene(grp);
    viewer.getManipulator().computeHomePosition();
    viewer.run();
  
};



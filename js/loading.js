
var startTimeLoading;
var loadedTypes = 2;
var loadedOk = function() {
    loadedTypes -= 1;
    if (loadedTypes === 0) {
        loadedFinished();
    }
};

var loadedFinished = function() {
    document.getElementById("loading").style.display = 'None';
    var duration = new Date().getTime();    
    duration -= startTimeLoading;
    osg.log("Loading finished in " + duration/1000.0);
    start();
};

var nbLoading = 0;
var removeLoading = function(child) {
    nbLoading -=1;
    if (nbLoading === 0) {
        loadedOk();
    }
};
var addLoading = function() {
    nbLoading+=1;
    document.getElementById("loading").style.display = 'Block';
};

var loadModel = function(url, cbfunc) {
    osg.log("loading " + url);
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function (aEvt) {
        if (req.readyState == 4) {
            if(req.status == 200) {
                var obj = JSON.parse(req.responseText);
                if (cbfunc) {
                    cbfunc(obj);
                }
                //osg.log(child);
                //node.addChild(child);
                removeLoading();
                osg.log("success " + url);
            } else{
                removeLoading();
                osg.log("error " + url);
            }
        }
    };
    req.send(null);
    addLoading();
};



function registerFunction(name, obj) {
    window[name] = function() {
        return obj;
    };
}


var loadImages = function() {
    var imageList = [ 
        "models/cubemap/posx.png",
        "models/cubemap/posy.png",
        "models/cubemap/posz.png",
        "models/cubemap/negx.png",
        "models/cubemap/negy.png",
        "models/cubemap/negz.png",
        "models/skybox/posx.png",
        "models/skybox/posy.png",
        "models/skybox/posz.png",
        "models/skybox/negx.png",
        "models/skybox/negy.png",
        "models/skybox/negz.png",
        "models/zeppelin_shadow.png",
        "models/zeppelin_propeller.png",
        "models/zeppelin_logo.png",
        "models/zeppelin_logo2.png",
        "models/ufo_shadow.png",
        "models/statue_shadow.png",
        "models/ring2.png",
        "models/ring1.png",
        "models/circle2.png",
        "models/statue_occlusion.png",
        "models/balloon_shadow.png",
        "models/plane_shadow.png",
        "models/plane_propeller.png",
        "models/plane_logo2.png",
        "models/plane_logo.png",
        "models/airballoon_shadow.png",
        "models/airballoon_logo.png",
        "models/envmap.png",
        "models/cloud.png",
    ];
    var nbImage = imageList.length;
    var images = {};
    for (var i = 0; i < imageList.length; i++ ) {
        var k = imageList[i];
        images[k] = new Image();
        images[k].onload = function() {
            osg.log("image " + this.src + " loaded");
            nbImage--;
            if (nbImage === 0) {
                loadedOk();
            }
        };
        images[k].src = k;
    }
    
    // replace readImage to use or preloaded images
    osgDB.readImage = function(url) {
        if (images[url] === undefined) {
            osg.log("warning can't load " + url + " image");
            var img = new Image;
            img.src = url;
            images[url] = img;
        }
        return images[url];
    };

};


var loadModels = function() {
    startTimeLoading = new Date().getTime();    

    loadModel("models/ground.osgjs", function(obj) {
        registerFunction('getGround', obj);
    });
    loadModel("models/balloon.osgjs", function(obj) {
        registerFunction('getBalloon', obj);
    });
    loadModel("models/status_anneaux.osgjs", function(obj) {
        registerFunction('getStatue', obj);
    });
    loadModel("models/ufo.osgjs", function(obj) {
        registerFunction('getUfo', obj);
    });
    loadModel("models/airballoon.osgjs", function(obj) {
        registerFunction('getAirballoon', obj);
    });
    loadModel("models/plane.osgjs", function(obj) {
        registerFunction('getPlane', obj);
    });
    loadModel("models/zeppelin.osgjs", function(obj) {
        registerFunction('getZeppelin', obj);
    });

    loadModel("models/plane_anim1.osgjs", function(obj) {
        registerFunction('getPlaneAnim1', obj);
    });
    loadModel("models/plane_anim2.osgjs", function(obj) {
        registerFunction('getPlaneAnim2', obj);
    });
    loadModel("models/plane_anim3.osgjs", function(obj) {
        registerFunction('getPlaneAnim3', obj);
    });
    loadModel("models/airballoon_anim1.osgjs", function(obj) {
        registerFunction('getAirballoonAnim1', obj);
    });
    loadModel("models/airballoon_anim2.osgjs", function(obj) {
        registerFunction('getAirballoonAnim2', obj);
    });

    loadModel("models/balloon_anim1.osgjs", function(obj) {
        registerFunction('getBalloonAnim1', obj);
    });
    loadModel("models/balloon_anim2.osgjs", function(obj) {
        registerFunction('getBalloonAnim2', obj);
    });
    loadModel("models/ufo_anim1.osgjs", function(obj) {
        registerFunction('getUfoAnim1', obj);
    });
    loadModel("models/ufo_anim2.osgjs", function(obj) {
        registerFunction('getUfoAnim2', obj);
    });
    loadModel("models/zeppelin_anim1.osgjs", function(obj) {
        registerFunction('getZeppelinAnim1', obj);
    });
    loadModel("models/zeppelin_anim2.osgjs", function(obj) {
        registerFunction('getZeppelinAnim2', obj);
    });
    loadModel("models/sphere.osgjs", function(obj) {
        registerFunction('getSphere', obj);
    });

    loadImages();
    
};
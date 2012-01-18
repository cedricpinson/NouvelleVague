var createZeppelin = function() {

    var getShader = function() {
        return getVehicleDarkerTexture();
    };


    var root = osgDB.parseSceneGraph(getZeppelin());
    root.accept(new SetShadowTextureInternalFormatVisitor());

    var zeppelinModelFinder = new FindNodeVisitor("zeppelin");
    root.accept(zeppelinModelFinder);
    var grp = zeppelinModelFinder.found[0];
    if (!grp) {
        osg.log("zeppelin not found");
    }
    var stateset = grp.getOrCreateStateSet();
    var prg = getShader();
    stateset.setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    stateset.setTextureAttributeAndMode(0, getTextureEnvMap() , osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    var mainpartFinder = new FindNodeVisitor("zeppelin_body");
    grp.accept(mainpartFinder);
    var mainpartStateSet = mainpartFinder.found[0].getOrCreateStateSet();

    var material = new osg.Material();
    material.setDiffuse([0.2, 0.2, 0.2, 1.0]);
    mainpartStateSet.setAttributeAndMode(material , osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    var lightParameter = new osg.Light();
    lightParameter.setDiffuse([0.8,0.8,0.8,1]);
    lightParameter.setAmbient([0,0,0,1]);
    
    grp.getOrCreateStateSet().setAttributeAndMode(lightParameter);


    var cokpitFinder = new FindNodeVisitor("zeppelin_cokpit");
    grp.accept(cokpitFinder);
    if (!cokpitFinder.found[0]) {
        osg.log("zeppelin_cokpit not found");
    }
    var cokpit = cokpitFinder.found[0];
    var cokpitGeomFinder = new FindGeometryFromMaterialVisitor("BlancGlossy");
    cokpit.accept(cokpitGeomFinder);
    var lightCokpit = new osg.Light();
    lightCokpit.setDiffuse([0.8,0.8,0.8,0.2]);
    lightCokpit.setAmbient([0,0,0,0.2]);

    var shareit = undefined;
    for (var c = 0, lc = cokpitGeomFinder.found.length; c < lc; c++) {
        var cokpitStateset = cokpitGeomFinder.found[c].getOrCreateStateSet();
        if (!shareit) {
            shareit = cokpitStateset;
            shareit.setAttributeAndMode(new osg.CullFace('DISABLE'));
            shareit.setAttributeAndMode(lightCokpit);

        } else {
            cokpitGeomFinder.found[c].setStateSet(shareit);
        }
    }


    var item = grp;

    var propellerModelFinder = new FindNodeVisitor("zeppelin_propeller");
    root.accept(propellerModelFinder);
    var propeller = propellerModelFinder.found[0];
    if (!propeller) {
        osg.log("zeppelin_propeller not found");
    }
    propeller.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE));
    propeller.getOrCreateStateSet().setAttributeAndMode(getFogSimpleTexture(), osg.StateAttribute.PROTECTED);
    propeller.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    propeller.addUpdateCallback(getPropellerUpdateCallback());


    var shadowFinder = new FindNodeVisitor("zeppelin_shadow");
    root.accept(shadowFinder);
    var shadow = shadowFinder.found[0];
    shadow.setStateSet(getShadowStateSet());

    (function() {
        for (var i = 0; i < shadow.parents.length; i++) {
            shadow.removeParent(shadow.parents[i]);
        }
    })();

    (function() {
        for (var i = 0; i < grp.parents.length; i++) {
            grp.removeParent(grp.parents[i]);
        }
    })();

    return [grp, shadow];
};

var createPlane = function() {

    var getShader = function() {
        return getVehicleLighterTexture();
    };

    var root = osgDB.parseSceneGraph(getPlane());
    root.accept(new SetShadowTextureInternalFormatVisitor());

    var planeModelFinder = new FindNodeVisitor("plane");
    root.accept(planeModelFinder);
    var grp = planeModelFinder.found[0];
    var item = grp;


    var stateset = grp.getOrCreateStateSet();
    var prg = getShader();
    stateset.setAttributeAndMode( prg );
    stateset.setTextureAttributeAndMode(0, getTextureEnvMap() , osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);


    var propellerModelFinder = new FindNodeVisitor("plane_propeller");
    root.accept(propellerModelFinder);
    var propeller = propellerModelFinder.found[0];
    if (!propeller) {
        osg.log("plane_propeller not found");
    }
    propeller.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace(osg.CullFace.DISABLE));
    propeller.getOrCreateStateSet().setAttributeAndMode(getBlendState());
    propeller.getOrCreateStateSet().setAttributeAndMode(getFogSimpleTexture());
    propeller.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    propeller.addUpdateCallback(getPropellerUpdateCallback());

    var shadowFinder = new FindNodeVisitor("plane_shadow");
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


    return [grp, shadow]; //, anim, child];
};
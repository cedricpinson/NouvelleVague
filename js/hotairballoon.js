var createAirBalloon = function() {

    var getShader = function() {
        return getVehicleLighterTexture();
    };

    var root = osgDB.parseSceneGraph(getAirballoon());
    root.accept(new SetShadowTextureInternalFormatVisitor());
    var modelFinder = new FindNodeVisitor("airballoon");
    root.accept(modelFinder);
    var item = modelFinder.found[0];

    var stateset = item.getOrCreateStateSet();
    var prg = getShader();
    stateset.setAttributeAndMode( prg );
    stateset.setTextureAttributeAndMode(0, getTextureEnvMap() , osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);


    var shadowFinder = new FindNodeVisitor("airballoon_shadow");
    root.accept(shadowFinder);
    var shadow = shadowFinder.found[0];
    shadow.setStateSet(getShadowStateSet());

    (function() {
        for (var i = 0; i < shadow.parents.length; i++) {
            shadow.removeParent(shadow.parents[i]);
        }
    })();

    (function() {
        for (var i = 0; i < item.parents.length; i++) {
            item.removeParent(item.parents[i]);
        }
    })();

    return [item, shadow];
};
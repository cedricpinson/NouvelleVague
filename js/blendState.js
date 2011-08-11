var getBlendState = function() {
    if (getBlendState.stateAttribute === undefined) {
        getBlendState.stateAttribute = new osg.BlendFunc('ONE','ONE_MINUS_SRC_ALPHA');
    }
    return getBlendState.stateAttribute;
};


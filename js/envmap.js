var getTextureEnvMap = function() {
    if (getTextureEnvMap.created !== undefined) {
        return getTextureEnvMap.created;
    }
    getTextureEnvMap.created = osg.Texture.createFromImage(osgDB.readImage("models/envmap.png"));
    return getTextureEnvMap.created;
};

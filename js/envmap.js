var getTextureEnvMap = function() {
    if (getTextureEnvMap.created !== undefined) {
        return getTextureEnvMap.created;
    }
    getTextureEnvMap.created = osg.Texture.create("models/envmap.png");
    return getTextureEnvMap.created;
};

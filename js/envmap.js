var getTextureEnvMap2D = function() {
    if (getTextureEnvMap.created !== undefined) {
        return getTextureEnvMap.created;
    }
    getTextureEnvMap.created = osg.Texture.createFromImage(osgDB.readImage("models/envmap.png"));
    return getTextureEnvMap.created;
};

var getTextureEnvMapCubemap = function() {
    if (getTextureEnvMapCubemap.created === undefined) {
        var texture = new osg.TextureCubeMap();
        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_X', osgDB.readImage('models/cubemap/posx.png'));
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_X', osgDB.readImage('models/cubemap/negx.png'));

        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Y', osgDB.readImage('models/cubemap/negy.png'));
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Y', osgDB.readImage('models/cubemap/posy.png'));

        texture.setImage('TEXTURE_CUBE_MAP_POSITIVE_Z', osgDB.readImage('models/cubemap/posz.png'));
        texture.setImage('TEXTURE_CUBE_MAP_NEGATIVE_Z', osgDB.readImage('models/cubemap/negz.png'));

        texture.setMinFilter('LINEAR_MIPMAP_LINEAR');
        getTextureEnvMapCubemap.created = texture;
    }
    return getTextureEnvMapCubemap.created;
};

var getTextureEnvMap = getTextureEnvMapCubemap;
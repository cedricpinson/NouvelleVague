var createRTT= function(scene, size, clouds) {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "void main(void) {",
            "gl_FragColor = vec4(0.0,0.0,0.0,0.0);",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var clearAlpha = osg.createTexturedQuad(0,0,0,
                                            size[0], 0 ,0,
                                            0, size[1] ,0);
    clearAlpha.getOrCreateStateSet().setAttributeAndMode(getShader());
    var blendFunc = new osg.BlendFunc(osg.BlendFunc.DST_COLOR, osg.BlendFunc.ONE,
                                      osg.BlendFunc.ZERO, osg.BlendFunc.ZERO);
    clearAlpha.getOrCreateStateSet().setAttributeAndMode(blendFunc);

    // we create a ortho camera to clear alpha
    var hudCamera = new osg.Camera();
    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    //hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    hudCamera.addChild(clearAlpha);

  
    var camera = new osg.Camera();
    camera.setName("RTT");
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    camera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    camera.setClearColor([1.0, 0.0, 0.0, 0.0]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(size[0],size[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
    
    clouds.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE','ZERO'));
    camera.addChild(scene);
    //camera.addChild(hudCamera);
    var clear = new osg.Geometry();
    clear.drawImplementation = function(state) {
        var gl = state.getGraphicContext();
        gl.enable(gl.COLOR_WRITEMASK);
        gl.colorMask(false, false, false, true);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(osg.Camera.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.COLOR_WRITEMASK);

    };
    clear.computeBoundingBox = function(boundingBox) { return boundingBox; };
    camera.addChild(clear);
    camera.addChild(clouds);
    camera.renderedTexture = rttTexture;

    return camera;
};

var createDebugRTT = function(rtt_camera) {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "  FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "void main(void) {",
            "vec4 frag = texture2D(Texture0, FragTexCoord0);",
            // Here 1.0 is for debug !!!!!
            "frag.a = 1.0;",
            "gl_FragColor = frag;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var rttCamera = new osg.Camera();
    rttCamera.setName("DebugCamera");
    var ratio = rtt_camera.getViewport().height() / rtt_camera.getViewport().width();
    var size = [ 480 ];
    size[1] = size[0]*ratio;

    // we create a ortho camera to display the rtt in hud like
    var hudCamera = new osg.Camera();

    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    //hudCamera.setViewMatrix(osg.Matrix.makeTranslate(25,25,0));
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));

    var texturedQuadUsingTargetTexture = osg.createTexturedQuad(0,0,0,
                                                                size[0], 0 ,0,
                                                                0, size[1] ,0);
    texturedQuadUsingTargetTexture.getOrCreateStateSet().setTextureAttributeAndMode(0, rtt_camera.renderedTexture);
    texturedQuadUsingTargetTexture.getOrCreateStateSet().setAttributeAndMode(getShader());
    hudCamera.addChild(texturedQuadUsingTargetTexture);

    return hudCamera;
};
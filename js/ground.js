var createGround = function() {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord1;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 CameraInverseMatrix;",
            "varying vec2 FragTexCoord0;",
            "varying vec3 worldPosition;",
            "varying vec3 cameraPosition;",
            "varying float zDepth;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "",
            "void main(void) {",
            "cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
            "gl_Position = ftransform();",
            "FragTexCoord0 = TexCoord1;",

            "vec4 pos = ModelViewMatrix * vec4(Vertex,1.0);",
            "zDepth = (-pos.z - 0.1)/(450.0);",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "varying vec3 cameraPosition;",
            "uniform sampler2D Texture1;",
            "varying float zDepth;",

           "uniform float depthCurveFactor;",
           "uniform float cameraZFactor;",
           "uniform float distMin;",
 
            "void main(void) {",
            "vec4 color = texture2D(Texture1, FragTexCoord0);",
            "vec3 camVector = normalize(cameraPosition);",
            "float dist;",
            // gnupulot - plot exp(x*6.0)/250
            "float factor = depthCurveFactor*(1.0-camVector.z);",
            "float depth = clamp(exp(zDepth*factor)/250.0, 0.0, 1.0);",
            "float ratio = (1.0-camVector.z); ratio *=ratio;",
            "dist = max(depth* cameraZFactor * ratio, distMin);",
            "float edge = 0.5-dist;",
            "float end = 0.5+dist;",
            " if (color.a < edge) {",
            "   discard;",
            "   return;",
            " }",
            "float a = smoothstep(edge, end, color.a);",
            "color.rgb *= a;",
            "color.a = a;",
            "color = color * color.a;",
            "gl_FragColor = color;",
            "//gl_FragColor = vec4(vec3(ycam), 1.0);",
            "}"
        ].join('\n');
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        return program;
    };

    var ground = osgDB.parseSceneGraph(getGround());
    ground.getOrCreateStateSet().setAttributeAndMode(getShader());
    ground.getOrCreateStateSet().setAttributeAndMode(getBlendState());
    ground.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(15.0, 'depthCurveFactor'));
    ground.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(0.39, 'cameraZFactor'));
    ground.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(0.1, 'distMin'));


    var params = new osgUtil.ShaderParameterVisitor();
    params.setTargetHTML(document.getElementById("Parameters"));

    params.types.float.params['depthCurveFactor'] = {
        min: 1,
        max: 20.0,
        step: 0.1,
        value: function() { return [1]; }
    };

    params.types.float.params['cameraZFactor'] = {
        min: 0,
        max: 2.0,
        step: 0.01,
        value: function() { return [1]; }
    };

//    ground.accept(params);

    return ground;
};

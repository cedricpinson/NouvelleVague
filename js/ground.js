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
            "worldPosition = vec3((CameraInverseMatrix * ModelViewMatrix) * vec4(Vertex, 1.0));",
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
            "varying vec3 worldPosition;",
            "varying vec3 cameraPosition;",
            "uniform sampler2D Texture1;",
            "varying float zDepth;",

            "FOG_CODE_INJECTION",

            "void main(void) {",
            "vec4 color = texture2D(Texture1, FragTexCoord0);",
            "#if 1",
            "vec3 camVector = normalize(cameraPosition);",
            "float dist;",
            "//float ycam = zDepth*(0.5 + 0.5*(cameraPosition.z)/450.0);",
            // gnupulot - plot exp(x*6.0)/250
            "float depth = clamp(exp(zDepth*6.0)/250.0, 0.0, 1.0);",
            "dist = max(depth*1.2*( (1.0-camVector.z) * 0.5), 0.1);",
            "float edge = 0.4;",
            "float end = 0.6;",
            "edge = 0.5-dist;",
            "end = 0.5+dist;",
            " if (color.a < edge) {",
            "   discard;",
            "   return;",
            " }",
            "float a = smoothstep(edge, end, color.a);",
            "//float a = 1.0;",
            "//float a = clamp(color.a*2.0, 0.0, 1.0);",
            "color.rgb *= a;",
            "color.a = a;",
            "//color.rgb *= color.a;",
            "color = fog3(color)* color.a;",
            "#else",
            "color.rgb *= color.a;",
            "color = fog3(color)* color.a;",
            "#endif",
            "gl_FragColor = color;",
            "//gl_FragColor = vec4(vec3(ycam), 1.0);",
            "}",
        ].join('\n');
        fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        return program;
    };

    var ground = osgDB.parseSceneGraph(getGround());
    ground.getOrCreateStateSet().setAttributeAndMode(getShader());
    //ground.getOrCreateStateSet().setAttributeAndMode(new osg.Depth());
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE','ONE_MINUS_SRC_ALPHA'));
    return ground;
};

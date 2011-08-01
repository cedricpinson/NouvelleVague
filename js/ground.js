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

            "FOG_CODE_INJECTION",

            "void main(void) {",
            "vec4 color = texture2D(Texture1, FragTexCoord0);",
            "#if 1",
            "float edge = 0.4;",
            "float end = 0.6;",
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
            "}",
        ].join('\n');
        fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        return program;
    };

    var ground = osgDB.parseSceneGraph(getGround());
    ground.getOrCreateStateSet().setAttributeAndMode(getShader());
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE','ONE_MINUS_SRC_ALPHA'));
    return ground;
};

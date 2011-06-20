var createBackground = function() {
    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord1;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "varying vec2 FragTexCoord0;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "",
            "void main(void) {",
            "gl_Position = ftransform();",
            "FragTexCoord0 = TexCoord1;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture1;",
            "",
            "void main(void) {",
            "gl_FragColor = texture2D(Texture1, FragTexCoord0);",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        return program;
    };

    var model = osgDB.parseSceneGraph(getBackground());
    model.getOrCreateStateSet().setAttributeAndMode(getShader());
    return model;
};
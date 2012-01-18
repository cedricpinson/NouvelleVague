var getShadowStateSet = function() {
    if (getShadowStateSet.stateset === undefined) {
        var getShadowShader = function() {
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
                "",
                "vec4 ftransform() {",
                "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
                "}",
                "",
                "void main(void) {",
                "vec3 cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
                 "worldPosition = vec3((CameraInverseMatrix * ModelViewMatrix) * vec4(Vertex, 1.0));",
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
                "uniform float altitude;",
                "varying vec3 worldPosition;",

                "FOG_CODE_INJECTION",

                "void main(void) {",
                "vec4 color = texture2D(Texture1, FragTexCoord0);",
                "float edge = 0.01;",
                "float end = 1.0;",
                " if (color.r < edge) {",
                "   discard;",
                "   return;",
                " }",
                "float alpha = smoothstep(edge, end, color.r) * altitude;",
                "color = vec4(vec3(0.0), alpha);",
                "color = fog3(color)*alpha;",
                "gl_FragColor = color;",
                "}",
            ].join('\n');
            fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
            var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                          new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

            return program;
        };
        var st = new osg.StateSet();
        var depth = new osg.Depth();
        depth.setWriteMask(false);
        st.setAttributeAndMode(depth);
        st.setAttributeAndMode(getShadowShader());
        st.setAttributeAndMode(getBlendState());
        
        getShadowStateSet.stateset = st;
    }
    return getShadowStateSet.stateset;
};


var getShadowProgramTest = function() {
    if (getShadowProgramTest.stateset === undefined) {
        var getShadowShader = function() {
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
                "",
                "vec4 ftransform() {",
                "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
                "}",
                "",
                "void main(void) {",
                "worldPosition = vec3((CameraInverseMatrix * ModelViewMatrix) * vec4(Vertex, 1.0));",
                "vec3 cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
                "gl_Position = ftransform();",
                "}",
            ].join('\n');

            var fragmentshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "varying vec2 FragTexCoord0;",
                "varying vec3 worldPosition;",

                "FOG_CODE_INJECTION",

                "void main(void) {",
                "float alpha = 0.3;",
                "vec4 color = vec4(0.0, 0.0, 0.0, alpha);",
                "color = fog3(color)*alpha;",
                "gl_FragColor = color;",
                "}",
            ].join('\n');
            fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
            var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                          new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

            return program;
        };
        var st = new osg.StateSet();
        var depth = new osg.Depth();
        depth.setWriteMask(false);
        st.setAttributeAndMode(depth, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
        st.setAttributeAndMode(getShadowShader(), osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
        
        getShadowProgramTest.stateset = st;
    }
    return getShadowProgramTest.stateset;
};
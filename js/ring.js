var getRingShader = function() {
    if (getRingShader.shader === undefined) {
        var getShader = function() {
            var vertexshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "attribute vec3 Vertex;",
                "attribute vec3 Normal;",
                "attribute vec2 TexCoord1;",
                "varying vec2 TexCoord1Frag;",
                "uniform mat4 ModelViewMatrix;",
                "uniform mat4 ProjectionMatrix;",
                "uniform mat4 CameraInverseMatrix;",
                "",
                "varying vec3 EyeWorld;",
                "varying vec3 NormalWorld;",
                "",
                "vec4 ftransform() {",
                "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
                "}",
                "",
                "vec3 computeEyeDirection() {",
                "return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
                "}",
                "",
                "",
                "void main(void) {",
                "  mat4 worldMatrix = CameraInverseMatrix * ModelViewMatrix;",
                "  NormalWorld = vec3( mat3(worldMatrix) * Normal);",
                "  vec3 worldPosition = vec3(worldMatrix * vec4(Vertex, 1.0));",
                "  vec3 cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
                "  EyeWorld = worldPosition - cameraPosition;",
                "  TexCoord1Frag = TexCoord1;",
                "gl_Position = ftransform();",
                "}",
            ].join('\n');

            var fragmentshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "vec4 fragColor;",
                "uniform mat4 ModelViewMatrix;",
                "varying vec2 TexCoord1Frag;",
                "varying vec3 EyeWorld;",
                "varying vec3 NormalWorld;",

                "uniform samplerCube Texture0;",
                "uniform sampler2D Texture1;",
                "uniform sampler2D Texture2;",

                "uniform float t0;",
                "uniform float t1;",

                "uniform float envmapReflection;",
                "uniform float envmapReflectionStatue;",
                "uniform float envmapReflectionCircle;",

                "void main(void) {",
                "vec4 LightColor = vec4(0.0);",

                "float tt0 = t0 - 1.0;",
                "float tt1 = mod(t0+1.0,2.0) - 1.0;",
                "vec2 uv0 = TexCoord1Frag+vec2(tt0,0.0);",
                "vec2 uv1 = TexCoord1Frag+vec2(tt1,0.0);",
                "vec4 text0 = texture2D( Texture1, uv0 );",
                "vec4 text1 = texture2D( Texture2, uv1 );",
                "float fade0 = ( smoothstep(0.0, 0.05,uv0[0]) * (1.0-smoothstep(0.95, 1.0,uv0[0])));",
                "float fade1 = ( smoothstep(0.0, 0.05,uv1[0]) * (1.0-smoothstep(0.95, 1.0,uv1[0])));",
                "float edgeSize = 0.02;",
                "fade0 = smoothstep(tt0+edgeSize, tt0+2.0*edgeSize,uv0[0]);",
                "//fade1 = 1.0-smoothstep(tt0+(1.0-2.0*edgeSize), tt0+1.0,uv0[0]);",
                "fade1 = 1.0-smoothstep(tt0+(1.0-3.0*edgeSize), tt0+1.0-1.0*edgeSize,uv0[0]);",

                "vec3 reflectWorldFrag = reflect(normalize(EyeWorld), normalize(NormalWorld));",

                "vec3 uv = -reflectWorldFrag.xzy;",
                "vec4 refl = textureCube( Texture0, uv);",
                "refl *= envmapReflectionStatue;",

                "vec4 color = vec4(1.0 - text1.r*text0.r)*(fade0 * fade1) + (LightColor + refl);",
                "gl_FragColor = vec4(vec3(color.rgb), 1.0);",
                "}",
            ].join('\n');
            var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                          new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

            return program;
        };
        getRingShader.shader = getShader();
    }
    return getRingShader.shader;
};

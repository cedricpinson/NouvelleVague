var getFogVertexCode = function() {
    
};

var getFogFragmentCode = function() {

    var fragmentshader = [
        "uniform int override;",
        "vec4 fog3(vec4 inputColor) {",
        "  float fogfar = 1.0;",
        "  if (override == 0) {",
        "     fogfar = 1.0 - smoothstep(600.0,650.0, length(worldPosition));",
        "     fogfar *= 1.0 - smoothstep(150.0, 250.0,worldPosition[2]);",
        "  }",
        "  float value = fogfar;",
        "  vec3 fogColor = vec3(1.0);",
        "  vec4 color = mix(vec4(fogColor,1.0), inputColor, value);",
        "  color *=  fogfar;",
        "  return color;",
        "}"
    ].join('\n');
    
    return fragmentshader;
};




var getVehicleVertexCode = function() {
    var vertexshader = [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "attribute vec3 Vertex;",
        "attribute vec3 Normal;",
        "attribute vec2 TexCoord1;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform mat4 NormalMatrix;",
        "uniform mat4 CameraInverseMatrix;",
        "",
        "varying vec3 NormalEyeFrag;",
        "varying vec3 NormalWorldFrag;",
        "varying vec3 ReflectWorldFrag;",
        "varying vec3 VertexEyeFrag;",
        "varying vec2 TexCoord1Frag;",
        "varying vec3 worldPosition;",
        "varying vec3 cameraPosition;",
        "",
        "vec4 ftransform() {",
        "  return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
        "}",
        "vec3 computeNormal() {",
        "  return vec3(NormalMatrix * vec4(Normal, 0.0));",
        "}",
        "",
        "vec3 computeEyeDirection() {",
        "  return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
        "}",
        "void main(void) {",
        "  VertexEyeFrag = computeEyeDirection();",
        "  NormalEyeFrag = computeNormal();",
        "  vec3 normalWorld = mat3(CameraInverseMatrix * ModelViewMatrix) * Normal;",

        "  TexCoord1Frag = TexCoord1;",
        "  worldPosition = vec3((CameraInverseMatrix * ModelViewMatrix) * vec4(Vertex, 1.0));",
        "  cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
        "  vec3 eyeWorld = normalize(worldPosition-cameraPosition);",
        "  ReflectWorldFrag = reflect(eyeWorld, normalWorld);",

        "  gl_Position = ftransform();",
        "}",
        "" ].join('\n');
    return vertexshader;
};

var getVehicleFragmentCode = function() {

    var fragmentshader = [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "vec4 fragColor;",
        "uniform mat4 ModelViewMatrix;",
        "varying vec3 VertexEyeFrag;",
        "varying vec3 NormalEyeFrag;",
        "varying vec3 NormalWorldFrag;",
        "varying vec2 TexCoord1Frag;",
        "varying vec3 ReflectWorldFrag;",

        "//uniform sampler2D Texture0;",
        "uniform samplerCube Texture0;",

        "uniform sampler2D Texture1;",

        "uniform vec4 MaterialDiffuse;",
        "uniform vec4 Light0_diffuse;",

        "varying vec3 worldPosition;",
        "varying vec3 cameraPosition;",

        "uniform float envmapReflection;",
        "uniform float envmapReflectionStatue;",
        "uniform float envmapReflectionCircle;",

        "vec2 getTexEnvCoord(vec3 eye, vec3 normal) {",
        "vec3 r = normalize(reflect(eye, normal));",
        "float m = 2.0 * sqrt( r.x*r.x + r.y*r.y + (r.z+1.0)*(r.z+1.0) );",
        "vec2 uv;",
        "uv[0] = r.x/m + 0.5;",
        "uv[1] = r.y/m + 0.5;",
        "return uv;",
        "}",
        "",

        "FOG_CODE_INJECTION",

        "void main(void) {",
        "vec3 EyeVector = normalize(VertexEyeFrag);",
        "vec3 normal = normalize(NormalEyeFrag);",
        "float ndl = max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);",
        "vec4 LightColor = vec4(vec3(ndl), 1.0) * MaterialDiffuse * Light0_diffuse;",
        "//vec2 uv = getTexEnvCoord(EyeVector, normal);",
        "//vec4 refl = texture2D( Texture0, uv);",
        "vec3 uv = normalize(-ReflectWorldFrag).xzy; uv.z = -uv.z;",
        "vec4 refl = textureCube( Texture0, uv);",
        "refl *= envmapReflection;",
        ""
    ].join('\n');
    
    fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
    return fragmentshader;
};


var getVehicleWithoutTexture = function() {
    if (getVehicleWithoutTexture.program === undefined) {
        var v = getVehicleVertexCode();
        var f = getVehicleFragmentCode();
        var ext = [
            "  vec4 color = LightColor + refl;",
            "  gl_FragColor = fog3(color);",
            "}",
        ].join('\n');
        f += ext;
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, v),
                                      new osg.Shader(gl.FRAGMENT_SHADER, f));
        program.trackAttributes = { 'attributeKeys': ["Light0", "Material"],
                                    'textureAttributeKeys': [ ["Texture"] ] };
        getVehicleWithoutTexture.program = program;
    }
    return getVehicleWithoutTexture.program;
};

var getVehicleLighterTexture = function() {
    if (getVehicleLighterTexture.program === undefined) {
        var v = getVehicleVertexCode();
        var f = getVehicleFragmentCode();
        var ext = [
            "  vec4 tex = texture2D( Texture1, TexCoord1Frag);",
            "  float alpha = 1.0-tex.w;",
            "  vec4 baseColor = vec4(vec3(0.0),1.0);",
            "  vec4 color = mix((LightColor + refl), baseColor, alpha);",
            "  gl_FragColor = fog3(color) * (Light0_diffuse.w);",
            "}",
        ].join('\n');
        f += ext;
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, v),
                                      new osg.Shader(gl.FRAGMENT_SHADER, f));
        program.trackAttributes = { 'attributeKeys': ["Light0", "Material"],
                                    'textureAttributeKeys': [ ["Texture"] ] };
        getVehicleLighterTexture.program = program;
    }
    return getVehicleLighterTexture.program;
};

var getVehicleDarkerTexture = function() {
    if (getVehicleDarkerTexture.program === undefined) {
        var v = getVehicleVertexCode();
        var f = getVehicleFragmentCode();
        var ext = [
            "  vec4 tex = texture2D( Texture1, TexCoord1Frag);",
            "  float alpha = 1.0-tex.w;",
            "  vec4 baseColor = vec4(vec3(1.0) * alpha,1.0);",
            "  vec4 color = mix((LightColor + refl), baseColor, alpha);",
            "  gl_FragColor = fog3(color) * (Light0_diffuse.w);",
            "}",
        ].join('\n');
        f += ext;
        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, v),
                                      new osg.Shader(gl.FRAGMENT_SHADER, f));
        program.trackAttributes = { 'attributeKeys': ["Light0", "Material"],
                                    'textureAttributeKeys': [ ["Texture"] ] };
        getVehicleDarkerTexture.program = program;
    }
    return getVehicleDarkerTexture.program;
};


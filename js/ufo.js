var createUFO = function() {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec3 Normal;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 NormalMatrix;",
            "",
            "varying vec3 NormalEyeFrag;",
            "varying vec3 VertexEyeFrag;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "vec3 computeNormal() {",
            "return vec3(NormalMatrix * vec4(Normal, 0.0));",
            "}",
            "",
            "vec3 computeEyeDirection() {",
            "return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
            "}",
            "",
            "",
            "void main(void) {",
            "VertexEyeFrag = computeEyeDirection();",
            "NormalEyeFrag = computeNormal();",
            "gl_Position = ftransform();",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "vec4 fragColor;",
            "uniform mat4 ModelViewMatrix;",
            "varying vec3 VertexEyeFrag;",
            "varying vec3 NormalEyeFrag;",
            "uniform sampler2D Texture0;",
            "uniform vec4 MaterialAmbient;",
            "uniform vec4 MaterialDiffuse;",
            "uniform vec4 MaterialSpecular;",
            "uniform vec4 MaterialEmission;",
            "uniform float MaterialShininess;",

            "uniform bool Light0_enabled;",
            "uniform vec4 Light0_ambient;",
            "uniform vec4 Light0_diffuse;",
            "uniform vec4 Light0_specular;",
            "uniform vec3 Light0_direction;",
            "uniform float Light0_constantAttenuation;",
            "uniform float Light0_linearAttenuation;",
            "uniform float Light0_quadraticAttenuation;",

            "vec4 Ambient;",
            "vec4 Diffuse;",
            "vec4 Specular;",
            "vec3 EyeVector;",
            "vec3 NormalComputed;",
            "vec4 LightColor;",
            "",
            "void directionalLight(in vec3 lightDirection, in vec3 lightHalfVector, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse,in vec4 specular, in vec3 normal)",
            "{",
            "float nDotVP;         // normal . light direction",
            "float nDotHV;         // normal . light half vector",
            "float pf;             // power factor",
            "",
            "nDotVP = max(0.0, dot(normal, normalize(lightDirection)));",
            "nDotHV = max(0.0, dot(normal, lightHalfVector));",
            "",
            "if (nDotHV == 0.0)",
            "{",
            "pf = 0.0;",
            "}",
            "else",
            "{",
            "pf = pow(nDotHV, MaterialShininess);",
            "}",
            "Ambient  += ambient;",
            "Diffuse  += diffuse * nDotVP;",
            "Specular += specular * pf;",
            "}",
            "",
            "void flight(in vec3 lightDirection, in float constantAttenuation, in float linearAttenuation, in float quadraticAttenuation, in vec4 ambient, in vec4 diffuse, in vec4 specular, in vec3 normal)",
            "{",
            "vec4 localColor;",
            "vec3 lightHalfVector = normalize(EyeVector-lightDirection);",
            "// Clear the light intensity accumulators",
            "Ambient  = vec4 (0.0);",
            "Diffuse  = vec4 (0.0);",
            "Specular = vec4 (0.0);",
            "",
            "directionalLight(lightDirection, lightHalfVector, constantAttenuation, linearAttenuation, quadraticAttenuation, ambient, diffuse, specular, normal);",
            "",
            "vec4 sceneColor = vec4(0,0,0,0);",
            "localColor = sceneColor +",
            "MaterialEmission +",
            "Ambient  * MaterialAmbient +",
            "Diffuse  * MaterialDiffuse;",
            "localColor = clamp( localColor, 0.0, 1.0 );",
            "LightColor += localColor;",
            "}",

            "vec2 getTexEnvCoord(vec3 eye, vec3 normal) {",
            "vec3 r = normalize(reflect(eye, normal));",
            "float m = 2.0 * sqrt( r.x*r.x + r.y*r.y + (r.z+1.0)*(r.z+1.0) );",
            "vec2 uv;",
            "uv[0] = r.x/m + 0.5;",
            "uv[1] = r.y/m + 0.5;",
            "return uv;",
            "}",
            "",
            "void getLightColor(vec3 normal) {",
            "vec3 Light0_directionNormalized = normalize(Light0_direction);",
            "float Light0_NdotL = max(dot(normal, Light0_directionNormalized), 0.0);",
            "flight(Light0_directionNormalized, Light0_constantAttenuation, Light0_linearAttenuation, Light0_quadraticAttenuation, Light0_ambient, Light0_diffuse, Light0_specular, normal );",
            "}",


            "void main(void) {",
            "EyeVector = normalize(VertexEyeFrag);",
            "vec3 normal = normalize(NormalEyeFrag);",
            "LightColor = vec4(0,0,0,0);",
            "getLightColor(normal);",

            "vec2 uv = getTexEnvCoord(EyeVector, normal);",
            "vec4 refl = texture2D( Texture0, uv) * 0.5;",
            "gl_FragColor = LightColor + refl;",
            "}",
        ].join('\n');

        var program = osg.Program.create(osg.Shader.create(gl.VERTEX_SHADER, vertexshader),
                                         osg.Shader.create(gl.FRAGMENT_SHADER, fragmentshader));

        program.trackAttributes = { 'attributeKeys': ["Light0", "Material"],
                                    'textureAttributeKeys': [ ["Texture"] ] };
        return program;
    };


    var root = osgDB.parseSceneGraph(getUfo());
    var modelFinder = new FindNodeVisitor("ufo");
    root.accept(modelFinder);
    var item = modelFinder.found[0];

    var stateset = item.getOrCreateStateSet();
    var prg = getShader();
    stateset.setAttributeAndMode( prg, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
    stateset.setTextureAttributeAndMode(0, getTextureEnvMap() , osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);


    var shadowFinder = new FindNodeVisitor("ufo_shadow");
    root.accept(shadowFinder);
    var shadow = shadowFinder.found[0];

    (function() {
        for (var i = 0; i < shadow.parents.length; i++) {
            shadow.removeParent(shadow.parents[i]);
        }
    })();

    (function() {
        for (var i = 0; i < item.parents.length; i++) {
            item.removeParent(item.parents[i]);
        }
    })();

    return [item, shadow];
};

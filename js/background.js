var density = undefined;
function changeDensity(value)
{
    var dens = value/10000.0;
    document.getElementById('density').innerHTML = dens;
    osg.log("density " + dens);
    density.set([dens]);
}

var createBackground = function() {

    function getFogShader2()
    {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform mat4 CameraInverseMatrix;",
            "uniform vec4 fragColor;",
            "varying vec4 position;",
            "varying vec3 worldPosition;",
            "varying vec3 cameraPosition;",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "worldPosition = vec3((CameraInverseMatrix * ModelViewMatrix) * vec4(Vertex, 1.0));",
            "cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
            "  gl_Position = ftransform();",
            "  position = vec4(Vertex,1.0);",
            "}"
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform vec4 fragColor;",
            "varying vec4 position;",
            "varying vec3 worldPosition;",
            "varying vec3 cameraPosition;",
            "uniform vec4 MaterialAmbient;",
            "uniform float density;",

            "FOG_CODE_INJECTION",

            "vec4 fog(){",
            "  float d = density; //0.001;",
            "  float f = clamp((length(position)-400.0),0.0,10000.0)/400.0;",
            "  f = exp(-d*d/0.1 * (10000.0*f*f) * 1.44);",
            "  f = clamp(f, 0.0, 1.0);",
            "  vec4 color = mix(vec4(1.0), MaterialAmbient, f);",
            "  vec4 result = mix(vec4(f,f,f,f), color, f);",
            "  return result;",
            "}",
            "void main(void) {",
            "vec4 color = fog();",
            "  gl_FragColor = fog3(color)*color.a;",
            "  //gl_FragColor.a *= color.a*color.a;",
            "  //gl_FragColor = color;",
            "}",
            ""
        ].join('\n');
        fragmentshader = fragmentshader.replace("FOG_CODE_INJECTION", getFogFragmentCode());
        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.trackAttributes = {};
        program.trackAttributes.attributeKeys = [];
        program.trackAttributes.attributeKeys.push('Material');

        return program;
    }

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

    var model ;
    var box = createSkyBox();
    var size = 2000;
    var group = new osg.Node();

    var ground = osg.createTexturedQuad(-size*0.5,-size*0.5,-25,
                                        size,0,0,
                                        0,size,0);
    var materialGround = new osg.Material();
    materialGround.setAmbient([0.6,0.6,0.6,1]);
    materialGround.setAmbient([0.4,0.4,0.4,1]);
    materialGround.setDiffuse([0,0,0,1]);
    ground.getOrCreateStateSet().setAttributeAndMode(materialGround);


    var ceil = osg.createTexturedQuad(-size*0.5,-size*0.5,200,
                                      size,0,0,
                                      0,size,0);
    var materialCeil = new osg.Material();
    materialCeil.setAmbient([1,1,1,1]);
    materialCeil.setDiffuse([0,0,0,1]);
    ceil.getOrCreateStateSet().setAttributeAndMode(materialCeil);

    group.addChild(box);
    group.addChild(ground);
    //group.addChild(ceil);

    density = osg.Uniform.createFloat1(0.01, 'density');
    group.getOrCreateStateSet().addUniform(density);
    ground.getOrCreateStateSet().setAttributeAndMode(getFogShader2());
    group.getOrCreateStateSet().setAttributeAndMode(new osg.Depth('DISABLE'));
    //group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));

    group.addChild(createGround());

    model = group;
    return model;
};
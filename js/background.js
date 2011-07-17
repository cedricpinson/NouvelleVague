var density = undefined;
function changeDensity(value)
{
    var dens = value/10000.0;
    document.getElementById('density').innerHTML = dens;
    osg.log("density " + dens);
    density.set([dens]);
}

var createBackground = function() {
    function getFogShader()
    {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform vec4 fragColor;",
            "varying vec4 position;",
            "void main(void) {",
            "    mat3 rotate = mat3(vec3(ModelViewMatrix[0]),vec3(ModelViewMatrix[1]),vec3(ModelViewMatrix[2]));",
            "  gl_Position = ProjectionMatrix * vec4(rotate*Vertex, 1.0);",
            "  position = ModelViewMatrix * vec4(Vertex,1.0);",
            "}"
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform vec4 fragColor;",
            "varying vec4 position;",
            "uniform vec4 MaterialAmbient;",
            "uniform float density;",
            "vec4 fog(){",
            "  float d = density; //0.001;",
            "  float f = gl_FragCoord.z/gl_FragCoord.w;",
            "  f = clamp(exp2(-d*d * f*f * 1.44), 0.0, 1.0);",
            "  float range = 0.7;",
            "  float alpha = (1.0-max(f , (1.0-range)))/range;",
            "  vec4 color = mix(vec4(1.0), MaterialAmbient, 1.0-alpha);",
            "  vec4 result = mix(vec4(f,f,f,f), color, f);",
            "  return result;",
            "}",
            "void main(void) {",
            "  gl_FragColor = fog();",
            "}",
            ""
        ].join('\n');

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
    var size = 1000;
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
    ground.getOrCreateStateSet().setAttributeAndMode(getFogShader());
    group.getOrCreateStateSet().setAttributeAndMode(new osg.Depth('DISABLE'));
    //group.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));

    group.addChild(createGround());

    model = group;
    return model;
};
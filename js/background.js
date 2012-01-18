var density = undefined;
function changeDensity(value)
{
    var dens = value/10000.0;
    document.getElementById('density').innerHTML = dens;
    osg.log("density " + dens);
    density.set([dens]);
}

var materialGround = undefined;
function changeGrey(value)
{
    document.getElementById('color').innerHTML = value;
    osg.log("grey " + value);
    if (materialGround) {
        var frac = value/255;
        materialGround.setAmbient([frac,frac,frac,1]);
    }
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
            "uniform vec4 fragColor;",
            "varying vec4 position;",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
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
            "uniform vec4 MaterialAmbient;",
            "uniform float density;",

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
            "  gl_FragColor = color;",
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

    var model ;
    var box = createSkyBox();
    var size = 4000;
    var group = new osg.Node();

    var ground = osg.createTexturedQuad(-size*0.5,-size*0.5,-25,
                                        size,0,0,
                                        0,size,0);
    materialGround = new osg.Material();
    materialGround.setAmbient([ 0xd3/255.0 , 0xd9/255.0, 0xe5/255.0, 1]);
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

    density = osg.Uniform.createFloat1(0.0020, 'density');
    group.getOrCreateStateSet().addUniform(density);
    ground.getOrCreateStateSet().setAttributeAndMode(getFogShader2());
    group.getOrCreateStateSet().setAttributeAndMode(new osg.Depth('DISABLE'));

    ground.getOrCreateStateSet().setAttributeAndMode(getBlendState());

    group.addChild(createGround());

    model = group;
    return model;
};
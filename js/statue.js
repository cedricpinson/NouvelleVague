var createStatue = function() {

    var getCanvasTexture = function(text) {
        var w,h;
        w = 1;
        h = 1;
        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', 1);
        canvas.setAttribute('height', 1);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
    };

    var getGroundShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord1;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "varying vec2 TexCoord1Frag;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "",
            "void main(void) {",
            "TexCoord1Frag = TexCoord1;",
            "gl_Position = ftransform();",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "vec4 fragColor;",
            "varying vec2 TexCoord1Frag;",
            "uniform sampler2D Texture1;",

            "void main(void) {",
            "vec4 color = texture2D( Texture1, TexCoord1Frag);",
            "color = vec4(vec3(0.0), 0.7*color.a);",
            "gl_FragColor = color;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.trackAttributes = { 'textureAttributeKeys': [ ["Texture"] ] };
        return program;
    };


    var getShader = function() {
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
            "varying vec3 VertexEyeFrag;",
            "varying vec2 TexCoord1Frag;",
            "varying vec3 EyeWorld;",
            "varying vec3 NormalWorld;",

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
            "  VertexEyeFrag = computeEyeDirection();",
            "  NormalEyeFrag = computeNormal();",
            "  mat4 worldMatrix = CameraInverseMatrix * ModelViewMatrix;",
            "  NormalWorld = vec3( mat3(worldMatrix) * Normal);",
            "  vec3 worldPosition = vec3(worldMatrix * vec4(Vertex, 1.0));",
            "  vec3 cameraPosition = vec3(CameraInverseMatrix[3][0], CameraInverseMatrix[3][1], CameraInverseMatrix[3][2]);",
            "  EyeWorld = worldPosition - cameraPosition;",

            "TexCoord1Frag = TexCoord1;",
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
            "varying vec2 TexCoord1Frag;",
            "varying vec3 EyeWorld;",
            "varying vec3 NormalWorld;",

            "uniform samplerCube Texture0;",
            "uniform sampler2D Texture1;",

            "uniform float envmapReflection;",
            "uniform float envmapReflectionStatue;",
            "uniform float envmapReflectionCircle;",

            "void main(void) {",
            "vec3 EyeVector = normalize(VertexEyeFrag);",
            "vec3 normal = normalize(NormalEyeFrag);",
            "vec4 LightColor = vec4(0.8 * max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0));",
            "vec3 reflectWorldFrag = reflect(normalize(EyeWorld), normalize(NormalWorld));",

            "vec3 uv = -reflectWorldFrag.xzy;",
            "vec4 refl = textureCube( Texture0, uv);",

            "refl *= envmapReflectionStatue;",
            "vec4 ambientOcclusion = texture2D( Texture1, TexCoord1Frag);",
            "vec4 color = ambientOcclusion*(LightColor + refl);",
            "gl_FragColor = color;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        program.trackAttributes = { 'attributeKeys': ["Light0", "Material"],
                                    'textureAttributeKeys': [ ["Texture"] ] };
        return program;
    };


    var grp = osgDB.parseSceneGraph(getStatue());
    var stateset = grp.getOrCreateStateSet();
    var prg = getShader();

    var statueFinder = new FindNodeVisitor("Statue");
    grp.accept(statueFinder);
    var statueStateSet = statueFinder.found[0].getOrCreateStateSet();

    var whiteTexture = getCanvasTexture();
    var t = new osg.Texture();
    t.setFromCanvas(whiteTexture);

    statueStateSet.setAttributeAndMode(prg);
    statueStateSet.setTextureAttributeAndMode(0, getTextureEnvMap());
    statueStateSet.setTextureAttributeAndMode(1, t);


    var groundFinder = new FindNodeVisitor("statue_shadow");
    grp.accept(groundFinder);
    var groundStateSet = groundFinder.found[0].getOrCreateStateSet();
    groundStateSet.setAttributeAndMode(getGroundShader());
    groundStateSet.setAttributeAndMode(getBlendState());


    grp.light = new osg.Light();
    grp.light.diffuse = [0.8,0.8,0.8,1];
    grp.light.ambient = [0,0,0,1];

    if (false) {
        var sp = osgDB.parseSceneGraph(getSphere());
        var mt = new osg.MatrixTransform();
        mt.setMatrix(osg.Matrix.makeScale(20,20,20, []));
        mt.addChild(sp);
        statueFinder.found[0].addChild(mt);

        var spSt = sp.getOrCreateStateSet();
        spSt.setAttributeAndMode(prg);
        spSt.setTextureAttributeAndMode(0, getTextureEnvMap());
        spSt.setTextureAttributeAndMode(1, t);
        spSt.setAttributeAndMode(new osg.CullFace('DISABLE'));
    }

    return grp;
};
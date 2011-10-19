var createCloud = function(name, nbVertexes) {
    if (nbVertexes === undefined) {
        nbVertexes = 5;
    }

    var getShader = function() {
        if (createCloud.shader === undefined) {
            var vertexshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "attribute vec4 Vertex;",
                "attribute vec2 TexCoord0;",
                "varying vec4 FragVertex;",
                "varying vec2 FragTexCoord0;",

                "uniform mat4 ModelViewMatrix;",
                "uniform mat4 ProjectionMatrix;",
                "uniform mat4 CameraInverseMatrix;",
                "uniform float scale;",
                "uniform float shrink;",
                "",


                "uniform float radius;",
                "vec4 position;",
                "",
                "vec4 ftransform(vec3 vertex) {",
                "position = ModelViewMatrix * vec4((vertex), 1.0);",
                "return ProjectionMatrix * position;",
                "}",
                "",
                "void main(void) {",
                "vec2 dir =  (TexCoord0-vec2(0.5)) * scale;",
                "gl_Position = ftransform( vec3(Vertex.xyz) * vec3(1.0, 1.0, shrink) * radius)  + vec4(vec3(dir[0], dir[1], 0.0), 0.0);",
                "//float depthNormalized = ( -position.z - gl_DepthRange.near)/gl_DepthRange.diff;",
                "//gl_PointSize = scale*100000.0/(depthNormalized);",
                "FragVertex = Vertex;",
                "FragTexCoord0 = TexCoord0;",
                "}",
            ].join('\n');

            var fragmentshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "vec4 fragColor;",
                "uniform mat4 ModelViewMatrix;",
                "uniform sampler2D Texture0;",
                "varying vec4 FragVertex;",
                "varying vec2 FragTexCoord0;",
                "uniform float opacity;",
                "uniform float scaleV;",
                "uniform float scaleU;",
                "uniform float blendDarker;",
                "uniform float blendDarkerFactor;",

                "void main(void) {",
                "vec2 center = vec2(0.5, 0.5);",
                "vec2 uvCenter = FragTexCoord0 - center;",
                "uvCenter.y *= scaleV;",
                "uvCenter.x *= scaleU;",
                "vec2 uv;",
                "float angle = FragVertex.w;",
                "uv.x = cos(angle)*uvCenter.x - sin(angle)*uvCenter.y;",
                "uv.y = sin(angle)*uvCenter.x + cos(angle)*uvCenter.y;",
                "vec4 texel = texture2D(Texture0, uv+center);",
                "texel.a *= opacity;",
                "// darker under",

                "if (texel.w < 1e-03) {",
                "  discard;",
                "  return;",
                "}",
                "vec3 darker = vec3(176.0/255.0, 183.0/255.0, 193.0/255.0)*blendDarkerFactor;",
                "float b = (1.0-texel.w)*blendDarker;",
                "texel.xyz = mix(vec3(texel.xyz), darker, b);",
                "//texel.xyz *= texel.w;",
                "//texel.xyz *= texel.w * 0.5*turbulence(vec3(uv,1.0)*2.0);",
                "gl_FragColor = vec4(texel);",
                "}",
            ].join('\n');

            var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                          new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
            program.trackAttributes = { 'attributeKeys': [],
                                        'textureAttributeKeys': [ ["Texture"] ] };

            createCloud.shader = program;
        }
        return createCloud.shader;
    };

    var getRand = function() {
        var x = -0.5+Math.random();
        var y = -0.5+Math.random();
        var z = -0.5+Math.random()*0.2;
        var vec = [];
        osg.Vec3.normalize([x, y, z], vec);
        osg.Vec3.mult(vec, Math.random(), vec);
        vec[3] = Math.random()*Math.PI;
        return vec;
    };
    var geom = new osg.Geometry();
    var vertexes = [];

    for (var i = 0, l = nbVertexes; i < l; i++) {
        var vec = getRand();
        vertexes.push(vec);
    }

    var texCoord0 = [];
    for (var i = 0, l = nbVertexes; i < l; i++) {
        texCoord0.push(0,0);
        texCoord0.push(0,1);
        texCoord0.push(1,1);
        texCoord0.push(1,0);
    }

    var elements = [];
    for (var i = 0, l = nbVertexes; i < l; i++) {
        elements.push(i*4+0,i*4+1,i*4+2, i*4+0,i*4+2,i*4+3);
    }

    var syncArray = function(bufferArray, vertexes) {
        var index = 0;
        var array = bufferArray.getElements();
        for (var i = 0, l = vertexes.length; i<l; i++) {
            var x = vertexes[i][0];
            var y = vertexes[i][1];
            var z = vertexes[i][2];
            var w = vertexes[i][3];
            array[index++] = x;
            array[index++] = y;
            array[index++] = z;
            array[index++] = w;

            array[index++] = x;
            array[index++] = y;
            array[index++] = z;
            array[index++] = w;

            array[index++] = x;
            array[index++] = y;
            array[index++] = z;
            array[index++] = w;

            array[index++] = x;
            array[index++] = y;
            array[index++] = z;
            array[index++] = w;
        }
        bufferArray.dirty();
    };

    geom.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, new Array(nbVertexes*4*4), 4 );
    geom.getAttributes().TexCoord0 = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, texCoord0, 2 );
//    geom.getPrimitives().push(new osg.DrawArrays(osg.PrimitiveSet.TRIANGLES, 0, nbVertexes*6));
    geom.getPrimitives().push(new osg.DrawElements(osg.PrimitiveSet.TRIANGLES, new osg.BufferArray(osg.BufferArray.ELEMENT_ARRAY_BUFFER, elements,1) ));


    syncArray(geom.getAttributes().Vertex, vertexes);

    var texture = new osg.Texture();
    var img = osgDB.readImage("models/cloud.png");
    texture.setImage(img);

    var grp = geom;
    var stateset = grp.getOrCreateStateSet();
    var prg = getShader();
    prg.setName(name);
    stateset.setAttributeAndMode(prg);
    stateset.setTextureAttributeAndMode(0, texture);
    stateset.setAttributeAndMode(new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
    stateset.setAttributeAndMode(new osg.CullFace('DISABLE'));
    //stateset.setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE'));
    //stateset.setAttributeAndMode(new osg.BlendFunc('SRC_COLOR', 'ONE_MINUS_SRC_ALPHA'));
    var depth = new osg.Depth();
    depth.setWriteMask(false);
    stateset.setAttributeAndMode(depth);

    var sort = function(cameraPosition) {
        var pos = cameraPosition;
        var cmp = function(a, b) {
            var pa0 = pos[0] - a[0];
            var pa1 = pos[1] - a[1];
            var pa2 = pos[2] - a[2];
            var sqra = pa0*pa0 + pa1*pa1 + pa2*pa2;

            var pb0 = pos[0] - b[0];
            var pb1 = pos[1] - b[1];
            var pb2 = pos[2] - b[2];
            var sqrb = pb0*pb0 + pb1*pb1 + pb2*pb2;
            
            return sqrb-sqra;
        };
        vertexes.sort(cmp);
        syncArray(geom.getAttributes().Vertex, vertexes);
    };

    var UpdateCallback = function() {
        this.update = function(node, nv) {
            var matrix = node.getMatrix();
            var inv = [];
            osg.Matrix.inverse(matrix, inv);
            var pos = cameraManager.getEyePosition();
            var pos2 = [];
            osg.Matrix.transformVec3(inv, pos, pos2);
            sort(pos2);
            return true;
        };
    };


    stateset.addUniform(osg.Uniform.createFloat1(0.84, "blendDarkerFactor"));
    stateset.addUniform(osg.Uniform.createFloat1(1.72, "blendDarker"));
    stateset.addUniform(osg.Uniform.createFloat1(228, "scale"));
    stateset.addUniform(osg.Uniform.createFloat1(-0.16, "shrink"));
    stateset.addUniform(osg.Uniform.createFloat1(1.0, "opacity"));
    stateset.addUniform(osg.Uniform.createFloat1(99, "radius"));
    stateset.addUniform(osg.Uniform.createFloat1(1.15, "scaleV"));
    stateset.addUniform(osg.Uniform.createFloat1(1.33, "scaleU"));
    stateset.setRenderingHint("TRANSPARENT_BIN");

    if (EnableTweaking) {
        var parameterElement = document.getElementById("Parameters");

        var params = new osgUtil.ShaderParameterVisitor();
        params.setTargetHTML(parameterElement);

        params.types.float.params['radius'] = {
            min: 1,
            max: 400.0,
            step: 0.5,
            value: function() { return [1]; }
        };

        params.types.float.params['opacity'] = {
            min: 0,
            max: 1.0,
            step: 0.001,
            value: function() { return [1.0]; }
        };

        params.types.float.params['scaleV'] = {
            min: 0.01,
            max: 10.0,
            step: 0.02,
            value: function() { return [1.0]; }
        };

        params.types.float.params['scaleU'] = params.types.float.params['scaleV'];

        params.types.float.params['scale'] = {
            min: 0.01,
            max: 1000.0,
            step: 0.02,
            value: function() { return [200.0]; }
        };

        params.types.float.params['blendDarker'] = {
            min: 0.01,
            max: 5.0,
            step: 0.01,
            value: function() { return [2.0]; }
        };

        params.types.float.params['blendDarkerFactor'] = {
            min: 0.01,
            max: 2.0,
            step: 0.01,
            value: function() { return [0.9]; }
        };

        params.types.float.params['turbulenceExponent'] = {
            min: 0.0,
            max: 5.0,
            step: 0.001,
            value: function() { return [0.002]; }
        };

        grp.accept(params);
    }

    var mt = new osg.MatrixTransform();
    mt.addChild(grp);
    mt.addUpdateCallback(new UpdateCallback());
    return mt;
};

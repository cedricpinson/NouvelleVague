var createCloud = function() {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec4 Vertex;",
            "attribute vec2 TexCoord0;",

            "varying vec2 TexCoord0Frag;",
            "varying vec4 FragVertex;",

            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "uniform float scale;",
            "uniform float shrink;",
            "",


            "uniform float radius;",
            "vec4 position;",
            "",
            "vec4 ftransform() {",
            "position = ModelViewMatrix * vec4((vec3(Vertex.xyz) * vec3(1.0, 1.0, shrink) ) *radius, 1.0);",
            "return ProjectionMatrix * position;",
            "}",
            "",
            "void main(void) {",
            "vec4 pos = ftransform();",
            "gl_Position = pos;",
            "float depthNormalized = ( -position.z - gl_DepthRange.near)/gl_DepthRange.diff;",
            "gl_PointSize = scale*100000.0/(depthNormalized);",
            "FragVertex = Vertex;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "vec4 fragColor;",
            "uniform mat4 ModelViewMatrix;",
            "uniform sampler2D Texture0;",
            "varying vec2 TexCoord0Frag;",
            "varying vec4 FragVertex;",
            "uniform float opacity;",

            "//",
            "// Description : Array and textureless GLSL 2D/3D/4D simplex ",
            "//               noise functions.",
            "//      Author : Ian McEwan, Ashima Arts.",
            "//  Maintainer : ijm",
            "//     Lastmod : 20110822 (ijm)",
            "//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.",
            "//               Distributed under the MIT License. See LICENSE file.",
            "//               https://github.com/ashima/webgl-noise",
            "// ",
            "",
            "vec3 mod289(vec3 x) {",
            "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
            "}",
            "",
            "vec4 mod289(vec4 x) {",
            "  return x - floor(x * (1.0 / 289.0)) * 289.0;",
            "}",
            "",
            "vec4 permute(vec4 x) {",
            "     return mod289(((x*34.0)+1.0)*x);",
            "}",
            "",
            "vec4 taylorInvSqrt(vec4 r)",
            "{",
            "  return 1.79284291400159 - 0.85373472095314 * r;",
            "}",
            "",
            "float snoise(vec3 v)",
            "  { ",
            "  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;",
            "  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);",
            "",
            "// First corner",
            "  vec3 i  = floor(v + dot(v, C.yyy) );",
            "  vec3 x0 =   v - i + dot(i, C.xxx) ;",
            "",
            "// Other corners",
            "  vec3 g = step(x0.yzx, x0.xyz);",
            "  vec3 l = 1.0 - g;",
            "  vec3 i1 = min( g.xyz, l.zxy );",
            "  vec3 i2 = max( g.xyz, l.zxy );",
            "",
            "  //   x0 = x0 - 0.0 + 0.0 * C.xxx;",
            "  //   x1 = x0 - i1  + 1.0 * C.xxx;",
            "  //   x2 = x0 - i2  + 2.0 * C.xxx;",
            "  //   x3 = x0 - 1.0 + 3.0 * C.xxx;",
            "  vec3 x1 = x0 - i1 + C.xxx;",
            "  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y",
            "  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y",
            "",
            "// Permutations",
            "  i = mod289(i); ",
            "  vec4 p = permute( permute( permute( ",
            "             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))",
            "           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) ",
            "           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));",
            "",
            "// Gradients: 7x7 points over a square, mapped onto an octahedron.",
            "// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)",
            "  float n_ = 0.142857142857; // 1.0/7.0",
            "  vec3  ns = n_ * D.wyz - D.xzx;",
            "",
            "  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)",
            "",
            "  vec4 x_ = floor(j * ns.z);",
            "  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)",
            "",
            "  vec4 x = x_ *ns.x + ns.yyyy;",
            "  vec4 y = y_ *ns.x + ns.yyyy;",
            "  vec4 h = 1.0 - abs(x) - abs(y);",
            "",
            "  vec4 b0 = vec4( x.xy, y.xy );",
            "  vec4 b1 = vec4( x.zw, y.zw );",
            "",
            "  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;",
            "  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;",
            "  vec4 s0 = floor(b0)*2.0 + 1.0;",
            "  vec4 s1 = floor(b1)*2.0 + 1.0;",
            "  vec4 sh = -step(h, vec4(0.0));",
            "",
            "  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;",
            "  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;",
            "",
            "  vec3 p0 = vec3(a0.xy,h.x);",
            "  vec3 p1 = vec3(a0.zw,h.y);",
            "  vec3 p2 = vec3(a1.xy,h.z);",
            "  vec3 p3 = vec3(a1.zw,h.w);",
            "",
            "//Normalise gradients",
            "  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));",
            "  p0 *= norm.x;",
            "  p1 *= norm.y;",
            "  p2 *= norm.z;",
            "  p3 *= norm.w;",
            "",
            "// Mix final noise value",
            "  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
            "  m = m * m;",
            "  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), ",
            "                                dot(p2,x2), dot(p3,x3) ) );",
            "  }",

            "float turbulence(vec3 pnt) {",
            "  vec3 p = pnt;",
            "  float f = snoise(p);",
            "  f += snoise(p*2.0)/2.0;",
            "  f += snoise(p*4.0)/4.0;",
            "  f += snoise(p*8.0)/8.0;",
            "  return f;",
            "  return 0.5+0.5*f;",
            "}",

            "void main(void) {",
            "vec2 center = vec2(0.5, 0.5);",
            "vec2 uvCenter = vec2(gl_PointCoord.x, 1.0-gl_PointCoord.y) - center;",
            "vec2 uv;",
            "float angle = FragVertex.w*2.0*3.14;",
            "uv.x = cos(angle)*uvCenter.x - sin(angle)*uvCenter.y;",
            "uv.y = sin(angle)*uvCenter.x + cos(angle)*uvCenter.y;",
            "vec4 texel = texture2D(Texture0, uv+center);",
            "// darker under",
            "if (FragVertex.z < 0.0 && gl_PointCoord.y>0.5) {",
            "   texel.xyz *= (1.0-((gl_PointCoord.y-0.5)*2.0));",
            "}",
            "texel.xyz *= texel.w * opacity;",
            "gl_FragColor = vec4(texel);",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        program.trackAttributes = { 'attributeKeys': [],
                                    'textureAttributeKeys': [ ["Texture"] ] };

        return program;
    };

    var getRand = function() {
        var x = -0.5+Math.random();
        var y = -0.5+Math.random();
        var z = -0.5+Math.random();
        var vec = [];
        osg.Vec3.normalize([x, y, z], vec);
        osg.Vec3.mult(vec, Math.random(), vec);
        vec[3] = Math.random();
        return vec;
    };
    var geom = new osg.Geometry();
    var vertexes = [];
    var nbVertexes = 5;
    for (var i = 0, l = nbVertexes; i < l; i++) {
        var vec = getRand();
        vertexes.push(vec);
    }

    var syncArray = function(bufferArray, vertexes) {
        var index = 0;
        var array = bufferArray.getElements();
        for (var i = 0, l = vertexes.length; i<l; i++) {
            array[index++] = vertexes[i][0];
            array[index++] = vertexes[i][1];
            array[index++] = vertexes[i][2];
            array[index++] = vertexes[i][3];
        }
        bufferArray.dirty();
    };

    geom.getAttributes().Vertex = new osg.BufferArray(osg.BufferArray.ARRAY_BUFFER, new Array(nbVertexes*4), 4 );
    geom.getPrimitives().push(new osg.DrawArrays(osg.PrimitiveSet.POINTS, 0, nbVertexes));

    syncArray(geom.getAttributes().Vertex, vertexes);

    var texture = new osg.Texture();
    var img = new Image();
    img.src = "models/cloud.png";
    texture.setImage(img);

    var grp = geom;
    var stateset = grp.getOrCreateStateSet();
    var prg = getShader();
    stateset.setAttributeAndMode(prg);
    stateset.setTextureAttributeAndMode(0, texture);
    stateset.setAttributeAndMode(new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));
    //stateset.setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE'));
    //stateset.setAttributeAndMode(new osg.BlendFunc('SRC_COLOR', 'ONE_MINUS_SRC_ALPHA'));
    var depth = new osg.Depth();
    depth.setWriteMask(false);
    stateset.setAttributeAndMode(depth);

    var sort = function(cameraPosition)  {
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
            var pos = CameraManager.getEyePosition();
            sort(pos);
            return true;
        };
    };


    var radius = osg.Uniform.createFloat1(10.0,"radius");

    var params = new osgUtil.ShaderParameterVisitor();
    params.setTargetHTML(document.getElementById("Parameters"));

    params.types.float.params['radius'] = {
        min: 1,
        max: 100.0,
        step: 0.5,
        value: function() { return [1]; }
    };

    params.types.float.params['opacity'] = {
        min: 0,
        max: 1.0,
        step: 0.001,
        value: function() { return [1.0]; }
    };

    params.types.float.params['scale'] = {
        min: 0.01,
        max: 5.0,
        step: 0.02,
        value: function() { return [1.0]; }
    };

    params.types.float.params['turbulenceExponent'] = {
        min: 0.0,
        max: 5.0,
        step: 0.001,
        value: function() { return [0.002]; }
    };

    grp.accept(params);

    var mt = new osg.MatrixTransform();
    mt.addChild(grp);
    mt.addUpdateCallback(new UpdateCallback());
    return mt;
};

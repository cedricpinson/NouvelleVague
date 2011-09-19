var createHudCamera = function(texture, size, shader) {
    var hudCamera = new osg.Camera();
    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    hudCamera.setClearColor([0.0, 0.0, 0.0, 0.0]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(size[0],size[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    hudCamera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);

    var quad = createTexturedQuad(texture, size, shader);
    var uniform = osg.Uniform.createFloat2([1.0/size[0], 1.0/size[1] ], "pixelSize");
    quad.getOrCreateStateSet().addUniform(uniform);

    hudCamera.addChild(quad);
    hudCamera.renderedTexture = rttTexture;
    return hudCamera;
};

var createNestedHudCamera = function(texture, size, shader) {
    var hudCamera = new osg.Camera();
    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    hudCamera.setClearColor([0.0, 1.0, 0.0, 0.0]);

    var quad = createTexturedQuad(texture, size, shader);
    var uniform = osg.Uniform.createFloat2([1.0/size[0], 1.0/size[1] ], "pixelSize");
    quad.getOrCreateStateSet().addUniform(uniform);

    hudCamera.addChild(quad);
    return hudCamera;
};

var createTexturedQuad = function(texture, size, shader) {
    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "  FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "void main(void) {",
            "vec4 frag = texture2D(Texture0, FragTexCoord0);",
            "gl_FragColor = frag;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var quad = osg.createTexturedQuad(0,0,0,
                                      size[0], 0 ,0,
                                      0, size[1] ,0);
    if (shader === undefined) {
        shader = getShader();
    }
    quad.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    quad.getOrCreateStateSet().setAttributeAndMode(shader);
    return quad;
};

var createRTT= function(scene, size, clouds) {

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "void main(void) {",
            "gl_FragColor = vec4(0.0,0.0,0.0,0.0);",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var clearAlpha = osg.createTexturedQuad(0,0,0,
                                            size[0], 0 ,0,
                                            0, size[1] ,0);
    clearAlpha.getOrCreateStateSet().setAttributeAndMode(getShader());
    var blendFunc = new osg.BlendFunc(osg.BlendFunc.DST_COLOR, osg.BlendFunc.ONE,
                                      osg.BlendFunc.ZERO, osg.BlendFunc.ZERO);
    clearAlpha.getOrCreateStateSet().setAttributeAndMode(blendFunc);

    // we create a ortho camera to clear alpha
    var hudCamera = new osg.Camera();
    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.addChild(clearAlpha);

  
    var camera = new osg.Camera();
    camera.setName("RTT");
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    camera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    camera.setClearColor([1.0, 0.0, 0.0, 0.0]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(size[0],size[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);

    clouds.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE','ZERO'));
    camera.addChild(scene);

    var clear = new osg.Geometry();
    clear.drawImplementation = function(state) {
        var gl = state.getGraphicContext();
        gl.enable(gl.COLOR_WRITEMASK);
        gl.colorMask(false, false, false, true);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(osg.Camera.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.COLOR_WRITEMASK);
    };
    clear.computeBoundingBox = function(boundingBox) { return boundingBox; };

    camera.addChild(clear);
    camera.addChild(clouds);
    camera.renderedTexture = rttTexture;

    return camera;
};

var blurTexture = function(texture, cloud2) {

    var getShaderX = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform vec2 pixelSize;",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "vec2 offset = vec2(pixelSize[0], 0.0);",
            "vec4 getValue(float i) {",
            "  vec2 off = i*offset;",
            "  vec4 c = texture2D(Texture0, FragTexCoord0 + off);",
            "  c.xyz *= c[3];",
            "  return c;",
            "}",
            "void main(void) {",
            "vec4 frag = 0.4*texture2D(Texture0, FragTexCoord0);",
            "frag += getValue(-3.0)*0.02;",
            "frag += getValue(-2.0)*.08;",
            "frag += getValue(-1.0)*.2;",
            "frag += getValue(1.0)*.2;",
            "frag += getValue(2.0)*0.08;",
            "frag += getValue(3.0)*0.02;",
            "gl_FragColor = frag;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };


    var getShaderY = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform vec2 pixelSize;",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "vec2 offset = vec2(0.0, pixelSize[1]);",

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

            "vec4 getValue(float i) {",
            "  vec2 off = i*offset;",
            "  //off *= turbulence(vec3(FragTexCoord0.x, FragTexCoord0.y, 0.0));",
            "  vec4 c = texture2D(Texture0, FragTexCoord0 + off);",
            "  c.xyz *= c[3];",
            "  return c;",
            "}",
            "void main(void) {",
            "vec4 frag = 0.4*texture2D(Texture0, FragTexCoord0);",
            "frag += getValue(-3.0)*0.02;",
            "frag += getValue(-2.0)*.08;",
            "frag += getValue(-1.0)*.2;",
            "frag += getValue(1.0)*.2;",
            "frag += getValue(2.0)*0.08;",
            "frag += getValue(3.0)*0.02;",
            "gl_FragColor = frag;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var grp = new osg.Node();
    var ratio = 2.0;
    //var size = [ texture.getWidth(), texture.getHeight() ] ;
    var size = [ texture.getWidth()/ratio, texture.getHeight()/ratio ] ;
    var hudx = createHudCamera(texture, size, getShaderX());
    var hudy = createHudCamera(hudx.renderedTexture, size, getShaderY());
    grp.addChild(hudx);
    grp.addChild(hudy);

    var windowSize = [window.innerWidth, window.innerHeight];
    size = windowSize;

    var camera = new osg.Camera();
    camera.setName("RTT2");
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 1);
    camera.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    camera.setClearColor([0.0, 0.0, 0.0, 0.0]);

    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(size[0],size[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
    camera.addChild(cloud2);
    grp.addChild(camera);


    var getMixShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform vec2 pixelSize;",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "uniform sampler2D Texture1;",

            "uniform float scaleUV;",
            "uniform float vertexScale;",
            "uniform float cloudDensity;",
            "uniform float turbulenceExponent;",

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

            
            "vec4 getPixel(vec2 uv)",
            "{",
            "// some const, tweak for best look",
            "const float sampleDist = 1.0;",
            "const float sampleStrength = 2.2; ",
            "   // some sample positions",
            "   float samples[10];",
            "   samples[0] = -0.08;",
            "   samples[1] = -0.05;",
            "   samples[2] = -0.03;",
            "   samples[3] = -0.02;",
            "   samples[4] = -0.01;",
            "   samples[5] = 0.01;",
            "   samples[6] = 0.02;",
            "   samples[7] = 0.03;",
            "   samples[8] = 0.05;",
            "   samples[9] = 0.08;",
            " ",
            "    // 0.5,0.5 is the center of the screen",
            "    // so substracting uv from it will result in",
            "    // a vector pointing to the middle of the screen",
            "    vec2 dir = 0.5 - uv; ",
            " ",
            "    // calculate the distance to the center of the screen",
            "    float dist = sqrt(dir.x*dir.x + dir.y*dir.y); ",
            " ",
            "    // normalize the direction (reuse the distance)",
            "    dir = dir/dist; ",
            " ",
            "    // this is the original colour of this fragment",
            "    // using only this would result in a nonblurred version",
            "    vec4 color = texture2D(Texture1,uv); ",
            " ",
            "    vec4 sum = color;",
            " ",
            "    // take 10 additional blur samples in the direction towards",
            "    // the center of the screen",
            "    for (int i = 0; i < 10; i++)",
            "    {",
            "      sum += texture2D( Texture1, uv + dir * samples[i] * sampleDist );",
            "    }",
            " ",
            "    // we have taken eleven samples",
            "    sum *= 1.0/11.0;",
            " ",
            "    // weighten the blur effect with the distance to the",
            "    // center of the screen ( further out is blurred more)",
            "    float t = dist * sampleStrength;",
            "    t = clamp( t ,0.0,1.0); //0 &lt;= t &lt;= 1",
            " ",
            "    //Blend the original color with the averaged pixels",
            "    return mix( color, sum, t );",
            "} ",

            "void main(void) {",
            "vec3 p = vec3(FragTexCoord0[0]-0.5, FragTexCoord0[1]-0.5, 0.0);",

            "float turb= pow(1.0+(turbulence(p*vertexScale)*cloudDensity), turbulenceExponent);",
            "//turb = turbulence(p*vertexScale)*cloudDensity;",
            "turb = texture2D(Texture0, FragTexCoord0).x;",
            "vec4 frag1 = getPixel(FragTexCoord0 + (vec2(turb)*scaleUV));",

            "//vec4 frag0 = texture2D(Texture0, FragTexCoord0);",
            "//frag1 = texture2D(Texture1, FragTexCoord0);",
            "gl_FragColor = frag1;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };


    var cameraMix = new osg.Camera();
    cameraMix.setName("RTT3");
    cameraMix.setRenderOrder(osg.Camera.PRE_RENDER, 2);
    cameraMix.setViewport(new osg.Viewport(0,0,size[0],size[1]));
    cameraMix.setClearColor([0.0, 0.0, 0.0, 0.0]);
    cameraMix.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    cameraMix.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    // texture attach to the camera to render the scene on
    var rttTextureMix = new osg.Texture();
    rttTextureMix.setTextureSize(size[0],size[1]);
    rttTextureMix.setMinFilter('LINEAR');
    rttTextureMix.setMagFilter('LINEAR');
    cameraMix.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTextureMix, 0);
    var qMix = createTexturedQuad(rttTexture, size, getMixShader());
    qMix.getOrCreateStateSet().setTextureAttributeAndMode(1, hudy.renderedTexture);

    qMix.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(1.0,"turbulenceExponent"));
    qMix.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(1.0,"cloudDensity"));
    qMix.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(10.0,"vertexScale"));
    qMix.getOrCreateStateSet().addUniform(osg.Uniform.createFloat1(.001,"scaleUV"));

    cameraMix.addChild(qMix);
    grp.addChild(cameraMix);

    var params = new osgUtil.ShaderParameterVisitor();
    params.setTargetHTML(document.getElementById("Parameters"));

    params.types.float.params['turbulenceExponent'] = {
        min: 0.0,
        max: 5.0,
        step: 0.001,
        value: function() { return [0.002]; }
    };

    params.types.float.params['scaleUV'] = {
        min: 0,
        max: 0.1,
        step: 0.001,
        value: function() { return [0.001]; }
    };

    params.types.float.params['cloudDensity'] = {
        min: 0,
        max: 1.0,
        step: 0.01,
        value: function() { return [0.001]; }
    };

    params.types.float.params['vertexScale'] = {
        min: 0,
        max: 50.0,
        step: 0.5,
        value: function() { return [10.0]; }
    };


    cameraMix.accept(params);

    //grp.renderedTexture = hudy.renderedTexture;
    //grp.renderedTexture = rttTexture;
    grp.renderedTexture = rttTextureMix;
    return grp;
};


var createDebugRTT = function(node) {
    var texture = node.renderedTexture;
    var textureSize = [ texture.getWidth(), texture.getHeight() ];

    var getShader = function() {
        var vertexshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "gl_Position = ftransform();",
            "  FragTexCoord0 = TexCoord0;",
            "}",
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture0;",
            "void main(void) {",
            "vec4 frag = texture2D(Texture0, FragTexCoord0);",
            // Here 1.0 is for debug !!!!!
            "frag.a = 1.0;",
            "gl_FragColor = frag;",
            "}",
        ].join('\n');

        var program = new osg.Program(new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                                      new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };

    var rttCamera = new osg.Camera();
    rttCamera.setName("DebugCamera");
    var ratio = textureSize[1] / textureSize[0];
    var size = [ 480 ];
    size[1] = size[0]*ratio;

    // we create a ortho camera to display the rtt in hud like
    var hudCamera = new osg.Camera();

    hudCamera.setProjectionMatrix(osg.Matrix.makeOrtho(0, size[0], 0, size[1], -5, 5));
    //hudCamera.setViewMatrix(osg.Matrix.makeTranslate(25,25,0));
    hudCamera.setRenderOrder(osg.Camera.NESTED_RENDER, 0);
    hudCamera.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    hudCamera.setViewport(new osg.Viewport(0,0,size[0],size[1]));

    var q = createTexturedQuad(texture, size, getShader());

    hudCamera.addChild(q);

    return hudCamera;
};


var renderCloud = function(originalTexture, node, scene) {
    var texture = node.renderedTexture;
    var textureSize = [ texture.getWidth(), texture.getHeight() ];
    var windowSize = [ window.innerWidth,
                       window.innerHeight ];

    // we create a ortho camera to display the rtt in hud like
    var hudCamera0 = createNestedHudCamera(originalTexture, windowSize);
    hudCamera0.getOrCreateStateSet().setAttributeAndMode( new osg.BlendFunc('ONE', 'ZERO'));
    var hudCamera1 = createNestedHudCamera(texture, windowSize);
    var blend = new osg.BlendFunc('SRC_ALPHA','ONE_MINUS_SRC_ALPHA');
    hudCamera1.getOrCreateStateSet().setAttributeAndMode(blend);

    var grp = new osg.Node();
    hudCamera1.getOrCreateStateSet().setAttributeAndMode(new osg.Depth('DISABLE'));

    //grp.addChild(hudCamera0);
    grp.addChild(scene);
    grp.addChild(hudCamera1);

    return grp;
};
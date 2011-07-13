var TextShader;
function getTextShader()
{
    if (TextShader === undefined) {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "varying vec2 FragTexCoord0;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform sampler2D Texture0;",
            "varying vec2 FragTexCoord0;",
            "void main(void) {",
            "vec4 color = texture2D( Texture0, FragTexCoord0.xy);",
            "gl_FragColor = color;",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        TextShader = program;
    }
    return TextShader;
}

var getCanvasText = function(text) {
    var w,h;
    w = 1024;
    h = 32;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.font = "16px Museo500";
    var size = ctx.measureText(text).width;
    ctx.textBaseline = 'middle';
//    ctx.textAlign = 'center';
    ctx.fillText(text, w/2.0 - size/2.0 , h/2.0);

    //document.body.appendChild(canvas);
    return canvas;
};
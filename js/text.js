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

var displayTweetToCanvas = function(tweet) {

    // tweet max size = 500/91
    // 
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', 512);
    canvas.setAttribute('height', 128);

    var twitterRendering = canvas;
    var textureSizeX = twitterRendering.width;
    var textureSizeY = twitterRendering.height;

    var ctx = twitterRendering.getContext("2d");

    ctx.save();
    var originalSizeX = 500;
    var originalSizeY = 91;
    var originalRatio = originalSizeY/originalSizeX;
    
    var scale = textureSizeX/originalSizeX;
    var invScale = 1.0/scale;
    var borderOffset = 4.0*invScale;

    ctx.scale(scale, scale);

    var maxWidth = originalSizeX - 2.0*borderOffset;
    var offsetWidthText = 58 + borderOffset;
    var sizeAuthor = 16;
    var offsetAuthor = 2;
    var nextLineAuthor = sizeAuthor + offsetAuthor;
    var sizeText = 18;
    var offsetText = 2;
    var nextLineText = sizeText + offsetText;
    var currentHeight = sizeAuthor + offsetAuthor;
    var sizeDate = 12;
    var textFont = "Arial"; //BPmono
    var authorFont = "Arial";
    var dateFont = "Arial";


    var lines = [];
    lines.push( { 'height' : currentHeight, 'author': tweet.from_user} );
    currentHeight += nextLineAuthor;
    ctx.font = sizeText + "px " + textFont;

    // compute and put text in multiline
    var text = tweet.text;
    var w = ctx.measureText(text); 
    var currentChar = 0;
    var maxWidthForTextInPixels = (maxWidth - offsetWidthText);
    var charSize = w.width/tweet.text.length;
    var lineSizeInChar = maxWidthForTextInPixels/charSize;
    while ( w.width > 0) {
        var diff = w.width - maxWidthForTextInPixels;
        if (diff > 0 ) {
            var nbChars = lineSizeInChar;
            if (nbChars > text.length)
                nbChars = text.length;
            subText = text.slice(0, nbChars);
            text = text.slice(nbChars);
            lines.push({ 'height':currentHeight, 'text' : subText});
            //ctx.fillText(subText, offsetWidthText, currentHeight);
            currentHeight += nextLineText;
            w = ctx.measureText(text);
        } else {
            lines.push({ 'height':currentHeight, 'text' : text});
            //ctx.fillText(text, offsetWidthText, currentHeight);
            break;
        }
    }

    currentHeight += nextLineText;
    ctx.font = sizeDate + "px " + dateFont;
    lines.push({ 'height':currentHeight, 'date' : tweet.created_at});
    currentHeight += sizeDate;
    osg.log("height " + currentHeight);
    ctx.restore();


    ctx.save();
    ctx.clearRect (0, 0, textureSizeX, textureSizeY);
    ctx.scale(scale, scale);
    //ctx.drawImage(img, borderOffset, 3 + borderOffset);
    ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";

    // draw it
    ctx.font = sizeAuthor + "px " + authorFont;
    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
    ctx.fillText(lines[0].author, offsetWidthText, lines[0].height);

    ctx.font = sizeText + "px " + textFont;
    for (var t = 1, l = lines.length-1; t < l; t++) {
        ctx.fillText(lines[t].text, offsetWidthText, lines[t].height);
    }
    
    ctx.font = sizeDate + "px " + dateFont;
    ctx.fillText(lines[lines.length-1].date, offsetWidthText, lines[lines.length-1].height);
    ctx.restore();

    ctx.globalCompositeOperation = "destination-atop";
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect (0, 0, textureSizeX, textureSizeY);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255, 169, 45, 1.0)";
    ctx.strokeRect (0, 0, textureSizeX, currentHeight);

    canvas.tweet = tweet;
    canvas.textureHeight = currentHeight;
    canvas.textureWidth = textureSizeX;
    return canvas;
}

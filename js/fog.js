var getFogVertexCode = function() {
    
};

var getFogFragmentCode = function() {

    var fragmentshader = [

        "vec4 fog3(vec4 inputColor) {",
        "  float fogfar = 1.0 - smoothstep(500.0,700.0, length(worldPosition));",
        "  float value = fogfar;",
        "  vec3 fogColor = vec3(1.0);",
        "  vec4 color = mix(vec4(fogColor,1.0), inputColor, value);",
        "  color *=  fogfar;",
        "  return color;",
        "}"
    ].join('\n');
    
    return fragmentshader;
};

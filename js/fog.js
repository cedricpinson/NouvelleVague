var getFogVertexCode = function() {
    
};

var getFogFragmentCode = function() {

    var fragmentshader = [
        "uniform int override;",
        "vec4 fog3(vec4 inputColor) {",
        "  float fogfar = 1.0;",
        "  if (override == 0) {",
        "     fogfar = 1.0 - smoothstep(600.0,650.0, length(worldPosition));",
        "     fogfar *= 1.0 - smoothstep(150.0, 250.0,worldPosition[2]);",
        "  }",
        "  float value = fogfar;",
        "  vec3 fogColor = vec3(1.0);",
        "  vec4 color = mix(vec4(fogColor,1.0), inputColor, value);",
        "  color *=  fogfar;",
        "  return color;",
        "}"
    ].join('\n');
    
    return fragmentshader;
};

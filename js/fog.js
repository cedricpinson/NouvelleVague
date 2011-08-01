var getFogVertexCode = function() {
    
};

var getFogFragmentCode = function() {
    var fragmentshader = [
        "float getFunction(float value) {",
        "   return value*0.01;",
        "}",
        "float getFunctionScale(float value) {",
        "   return 1.0;",
        "   return 1.0-smoothstep(0.0, 0.3, abs(value));",
        "}",
        "float getLengthSqr(vec3 position, float radius, vec3 scale) {",
        "  mat3 scaleMe = mat3(vec3(1.0/scale[0],0.0,0.0), vec3(0.0,1.0/scale[1],0.0), vec3(0.0,0.0,1.0/scale[2]));",
        "  vec3 worldPositionTransformed = scaleMe*worldPosition;",
        "  vec3 center = scaleMe*position;",
        "  vec3 cameraPositionTransformed = scaleMe*cameraPosition;",
        "  float radiusSqr = radius*radius;",
        "  vec3 vpc = center - worldPositionTransformed;",
        "  vec3 dir = cameraPositionTransformed - worldPositionTransformed;",
        "  vec3 l = normalize(dir);",
        "  float proj = dot(l,vpc);",
        "  vec3 pc = worldPositionTransformed + (l * proj);",
        "  if (proj < 0.0) {",
        "     if (dot(vpc,vpc) >= radiusSqr) {",
        "       return 0.0;",
        "     } else {",
        "       vec3 projectedFromCenter = pc-center;",
        "       float distSqrFromCenter = dot(projectedFromCenter,projectedFromCenter);",
        "       vec3 delta = pc - worldPositionTransformed;",
        "       float di1Sqr = (radiusSqr - distSqrFromCenter) - dot(delta,delta);",
        "       return di1Sqr;",
        "     }",
        "  } else {",
        "     float distSqrFromCenter = dot(center-pc,center-pc);",
        "     if (distSqrFromCenter >= radiusSqr) {",
        "         return 0.0;",
        "     }",
        "     float distSqr = radiusSqr - distSqrFromCenter;",
        "     vec3 pcp = pc - worldPositionTransformed;",
        "     float distPcpSqr = dot(pcp,pcp);",
        "     if (dot(vpc,vpc) > radiusSqr) {",
        "         vec3 enterPosition = worldPositionTransformed + l*sqrt((distPcpSqr-distSqr));",
        "         float coef = getFunction(distSqr/radius);",
        "         //coef *= getFunctionScale((enterPosition.x-center.x)/radius);",
        "         return 2.0*distSqr;",
        "     } else {",
        "         return distPcpSqr+distSqr;",
        "     }",
        "  }",
        "  return 0.0;",
        "}",
        "float getFogDist(float radius, vec3 position, vec3 scale) {",
        "   float distSqr = getLengthSqr(position, radius, scale);",
        "  distSqr *= getFunction(distSqr/(2.0*radius));",
        "  float value = clamp(1.0-distSqr/(radius*radius), 0.0, 1.0);",
        "  return value;",
        "}",
        "vec4 fog3(vec4 inputColor) {",
        "  float value = getFogDist(40.0,vec3(100.0,0.0, 100.0), 10.0*vec3(0.3,1.0,0.2));",
        "  vec3 fogColor = vec3(1.0);",
        "  vec4 color = mix(vec4(fogColor,1.0), inputColor, value);",
        "  return color;",
        "}"
    ].join('\n');
    
    return fragmentshader;
};

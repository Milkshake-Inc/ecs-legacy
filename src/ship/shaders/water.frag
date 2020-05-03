#include <packing>
#extension GL_OES_standard_derivatives : enable

varying vec2 vUv;
uniform sampler2D tDepth;

uniform float cameraNear;
uniform float cameraFar;

uniform float tTime;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

float sort(float value) {
  return 2.0 * cameraNear * cameraFar / (cameraFar + cameraNear - (2.0 * value - 1.0) * (cameraFar - cameraNear));
}

void main() {
  vec2 screenSpace = vec2(gl_FragCoord.x / 1280.0, gl_FragCoord.y / 720.0);

  float floorDepth = sort(texture2D(tDepth, screenSpace).r);
  float waterDepth = sort(gl_FragCoord.z);

  float depth = (floorDepth - waterDepth) * 0.5;
  depth = pow(depth, 2.0);
  depth = clamp(depth, 0.0, 1.0) * 0.8;

  vec4 DepthGradientShallow = vec4(0.325, 0.807, 0.971, 1.0);
  vec4 DepthGradientDeep = vec4(0.086, 0.407, 1.0, 0.8);

  float waterDepthDifference01 = saturate(depth / 1.0);
  vec4 waterColor = mix(DepthGradientShallow, DepthGradientDeep, waterDepthDifference01);

  float linearSin = 1.0 + sin(tTime / 1000.0) / 2.0;
  float wakeDepth = 0.001 + (linearSin * 0.004) * 2.0;
  float wetDepth = 0.001 + (linearSin * 0.001) * 0.5;

  if (depth < wetDepth) {
    // float power = mix(0.0, 0.2, depth/wetDepth);
    gl_FragColor = vec4(gl_FragColor.rgb, 0.2);
  } else if (depth < wakeDepth) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.7);
  } else {
    gl_FragColor = waterColor;
  }

  // float deptha = gl_FragCoord.z / gl_FragCoord.w;
  // float fogFactor = smoothstep( 80.0, 90.0, deptha );
  // gl_FragColor = mix( gl_FragColor.rgba, vec4(gl_FragColor.r, gl_FragColor.g, gl_FragColor.b, 0.0), fogFactor);
}

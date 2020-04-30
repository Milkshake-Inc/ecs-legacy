varying vec2 vUv;

uniform float tTime;

void main() {
    vUv = uv;
    vec3 transformed = vec3(position);
    transformed.z += sin(tTime / 2000.0) * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
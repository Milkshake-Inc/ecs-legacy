uniform bool maskMode;
uniform bool maskInvertMode;

uniform vec2 position;
uniform float size;
uniform float feather;
uniform float intensity;
uniform vec4 color;

void main() {
    float dist = distance(gl_FragCoord.xy, vec2(position.x, position.y));
    float power = smoothstep(size, size + feather, dist);

    if(maskMode) {
        if(maskInvertMode) {
            gl_FragColor = vec4(1.0 * (1.0 - power), 0.0, 0.0, 1.0);
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - power);
        }
    } else {
        gl_FragColor = vec4(color.r, color.g, color.b, 0.0) * (1.0 - power) * intensity;
    }

}
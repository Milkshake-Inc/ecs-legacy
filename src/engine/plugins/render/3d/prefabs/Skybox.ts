import { Entity } from '@ecs/core/Entity';
import Transform from '@ecs/plugins/math/Transform';
import { Color, DoubleSide, Mesh, ShaderMaterial, SphereGeometry } from 'three';

const vertexShader = `
varying vec3 vWorldPosition;

void main() {

    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;

const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {

    float h = normalize( vWorldPosition + offset ).y;
    gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );

}
`;

export const generateSkybox = (bottomColor = 0xffffff, topColor = 0x5ea9ff, offset = 400, exponent = 0.6) => {
	const uniforms = {
		bottomColor: { value: new Color(bottomColor) },
		topColor: { value: new Color(topColor) },
		offset: { value: offset },
		exponent: { value: exponent }
	};

	const sky = new Entity();
	sky.add(Transform);
	sky.add(
		new Mesh(
			new SphereGeometry(500, 32, 15),
			new ShaderMaterial({
				uniforms: uniforms,
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				side: DoubleSide
			})
		)
	);

	return sky;
};

import { useQueries } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import {
	Color as ThreeColor,
	DoubleSide,
	Geometry,
	Group,
	Mesh,
	PerspectiveCamera,
	RawShaderMaterial,
	Texture,
	TextureLoader,
	Vector3
} from 'three';
import { useThreeCouple } from '../../../../engine/plugins/3d/couples/ThreeCouple';
import RenderSystem from '../../../../engine/plugins/3d/systems/RenderSystem';

const createSDFShader = (opt: any) => {
	opt = opt || {};
	const opacity = typeof opt.opacity === 'number' ? opt.opacity : 1;
	const alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001;
	const precision = opt.precision || 'highp';
	const color = opt.color;
	const map = opt.map;
	const negate = typeof opt.negate === 'boolean' ? opt.negate : true;

	// remove to satisfy r73
	delete opt.map;
	delete opt.color;
	delete opt.precision;
	delete opt.opacity;
	delete opt.negate;

	return Object.assign(
		{
			uniforms: {
				opacity: { type: 'f', value: opacity },
				map: { type: 't', value: map || new Texture() },
				color: { type: 'c', value: new ThreeColor(color) }
			},
			vertexShader: [
				'attribute vec2 uv;',
				'attribute vec4 position;',
				'uniform mat4 projectionMatrix;',
				'uniform mat4 modelViewMatrix;',
				'varying vec2 vUv;',
				'void main() {',
				'vUv = uv;',
				'gl_Position = projectionMatrix * modelViewMatrix * position;',
				'}'
			].join('\n'),
			fragmentShader: [
				'#ifdef GL_OES_standard_derivatives',
				'#extension GL_OES_standard_derivatives : enable',
				'#endif',
				'precision ' + precision + ' float;',
				'uniform float opacity;',
				'uniform vec3 color;',
				'uniform sampler2D map;',
				'varying vec2 vUv;',

				'float median(float r, float g, float b) {',
				'  return max(min(r, g), min(max(r, g), b));',
				'}',

				'void main() {',
				'  vec3 sample = ' + (negate ? '1.0 - ' : '') + 'texture2D(map, vUv).rgb;',
				'  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;',
				'  float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);',
				'  gl_FragColor = vec4(color.xyz, alpha * opacity);',
				alphaTest === 0 ? '' : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
				'}'
			].join('\n')
		},
		opt
	);
};

export class SDFText {
	value = 'No Value';
	billboard = true;
	fontUrl = 'assets/golf/quicksand';
	color = Color.White;
}

export const useSDFTextCouple = (system: RenderSystem) => {
	const query = useQueries(system, {
		camera: any(PerspectiveCamera)
	});

	return useThreeCouple<Group>(system, all(Transform, SDFText), {
		onCreate: entity => {
			const group = new Group();

			const createText = async () => {
				(global as any).THREE = require('three');
				const loadFont = await import('load-bmfont');
				const createGeometry = await import('three-bmfont-text');

				const sdfText = entity.get(SDFText);

				loadFont.default(`${sdfText.fontUrl}.json`, (err, font) => {
					const geometry: Geometry = createGeometry.default({
						text: sdfText.value,
						font
					});

					const textureLoader = new TextureLoader();

					textureLoader.load(`${sdfText.fontUrl}.png`, texture => {
						const material = new RawShaderMaterial({
							...createSDFShader({
								map: texture,
								transparent: true
							}),
							side: DoubleSide
						});

						const mesh = new Mesh(geometry, material);
						geometry.computeBoundingBox();
						mesh.geometry.computeBoundingBox();

						const center = new Vector3();
						mesh.geometry.boundingBox.getCenter(center);
						mesh.position.copy(center.multiplyScalar(-0.003));
						mesh.scale.multiplyScalar(-0.003);
						mesh.scale.x *= -1;

						group.add(mesh);
					});
				});
			};

			createText();

			return group;
		},
		onLateUpdate: (entity, couple) => {
			const { billboard } = entity.get(SDFText);
			if (billboard) {
				const camera = query.camera.first;

				if (camera) {
					const perspectiveCamera = camera.get(PerspectiveCamera);

					if (billboard) couple.quaternion.copy(perspectiveCamera.quaternion);
				}
			}
		}
	});
};

import Transform from '@ecs/plugins/math/Transform';
import { LoadTexture } from '@ecs/plugins/tools/ThreeHelper';
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, RepeatWrapping, sRGBEncoding } from 'three';
import { Entity } from 'tick-knock';

export type SkyBoxTextures = [right?: string, left?: string, up?: string, down?: string, back?: string, front?: string];

export const generateTextureSkybox = async (textureUrls: SkyBoxTextures, size = 2000) => {
	const textures = await Promise.all(textureUrls.map(LoadTexture));

	textures.forEach(element => {
		element.wrapS = RepeatWrapping;
		element.repeat.set(-1, 1);
		element.encoding = sRGBEncoding;
	});

	const sky = new Entity();
	sky.add(Transform);
	sky.add(
		new Mesh(
			new BoxGeometry(size, size, size),
			textures.map(texture => new MeshBasicMaterial({
				map: texture,
				side: DoubleSide,
				fog: false
			}))
		)
	)

	return sky;
};

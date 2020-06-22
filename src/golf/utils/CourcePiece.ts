import { Entity } from '@ecs/ecs/Entity';
import TrimeshShape from '@ecs/plugins/physics/components/TrimeshShape';
import Transform from '@ecs/plugins/Transform';
import { Body } from 'cannon-es';
import { Material, Mesh } from 'three';
import CoursePiece from '../components/CoursePice';
import { KenneyAssetsGLTF } from '../components/GolfAssets';
import { FLOOR_MATERIAL } from '../constants/Materials';

export const buildCourcePieceEntity = (golfAssets: KenneyAssetsGLTF, modelName: string, transform: Transform) => {
	const model = golfAssets[modelName].scene.clone(true);

	model.traverse(node => {
		if (node instanceof Mesh && node.material instanceof Material) {
			node.material = node.material.clone();

			node.material.flatShading = true;
			node.material.transparent = false;
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});

	const entity = new Entity();
	entity.add(transform);
	entity.add(model);
	entity.add(new CoursePiece(modelName));
	entity.add(new TrimeshShape());
	entity.add(
		new Body({
			material: FLOOR_MATERIAL
		})
	);

	return entity;
};

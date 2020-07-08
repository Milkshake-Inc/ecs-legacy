import { Entity } from '@ecs/ecs/Entity';
import TrimeshShape from '@ecs/plugins/physics/components/TrimeshShape';
import Transform from '@ecs/plugins/Transform';
import { Body, Sphere } from 'cannon-es';
import { Material, Mesh } from 'three';
import CoursePiece from '../components/CoursePiece';
import { KenneyAssetsGLTF } from '../constants/GolfAssets';
import { FLOOR_MATERIAL } from '../constants/Materials';
import Hole from '../components/Hole';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Vector3 from '@ecs/math/Vector';

export const buildCourcePieceEntity = (golfAssets: KenneyAssetsGLTF, modelName: string, transform: Transform) => {
	const entities: Entity[] = [];

	const model = golfAssets[modelName].scene.clone(true);

	let hasHole = false;

	model.traverse(node => {
		if (node instanceof Mesh && node.material instanceof Material) {
			node.material = node.material.clone();

			node.material.flatShading = true;
			node.material.transparent = false;
			node.castShadow = true;
			node.receiveShadow = true;

			// e.g "Mesh holeRound_2"
			if (node.name.match('hole.*2')) {
				hasHole = true;
				node.parent.remove(node);
			}
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
	entities.push(entity);

	if (hasHole) {
		const hole = new Entity();
		hole.add(transform);
		hole.add(Hole);
		hole.add(
			new Body({
				collisionResponse: false // Make hole not collidable
			})
		);
		hole.add(new Sphere(0.02));

		entities.push(hole);
	}

	return entities;
};

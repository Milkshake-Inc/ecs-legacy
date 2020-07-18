import { Entity } from '@ecs/ecs/Entity';
import TrimeshShape from '@ecs/plugins/physics/components/TrimeshShape';
import Transform from '@ecs/plugins/Transform';
import { Body, Sphere, Box, Vec3 } from 'cannon-es';
import { Material, Mesh } from 'three';
import CoursePiece from '../components/CoursePiece';
import { KenneyAssetsGLTF } from '../constants/GolfAssets';
import { COURSE_MATERIAL, COURSE_BODY } from '../constants/Physics';
import Hole from '../components/Hole';

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
	entity.add(new Body(COURSE_BODY));
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
		hole.add(new Box(new Vec3(0.05, 0.02, 0.05)));

		entities.push(hole);
	}

	return entities;
};

import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '@ecs/ecs/Entity';
import { Mesh, Material, Group, MeshPhongMaterial, MeshStandardMaterial, Color, MeshPhysicalMaterial } from 'three';
import Transform from '@ecs/plugins/Transform';
import Hole from '../components/Hole';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Box, Vec3, BODY_TYPES } from 'cannon-es';
import TrimeshShape from '@ecs/plugins/physics/components/TrimeshShape';
import { COURSE_BODY } from '../constants/Physics';
import CoursePiece from '../components/CoursePiece';
import Spawn from '../components/Spawn';
import Vector3 from '@ecs/math/Vector';
import Track from '../components/terrain/Track';
import Cart from '../components/terrain/Cart';
import Rotor from '../components/terrain/Rotor';
import Synchronize from '../components/Synchronize';

const pieceModifiers = {
	flag: (entity: Entity, node: Mesh, entities: Entity[]) => {
		// Make flag pieces not collidable
		entity.remove(TrimeshShape);
		entity.remove(CannonBody);

		// Add holeTrigger
		const holeTrigger = new Entity();
		holeTrigger.add(entity.get(Transform)); // TODO don't share the same transform...
		holeTrigger.add(Hole);
		holeTrigger.add(
			new CannonBody({
				collisionResponse: false // Make hole collider not collidable. Only used for triggering.
			})
		);
		holeTrigger.add(new Box(new Vec3(0.06, 0.07, 0.06)));
		entities.push(holeTrigger);
	},
	spawn: (entity: Entity, node: Mesh, entities: Entity[]) => {
		const pos = entity.get(Transform);

		const index = parseInt(node.name.match(/\d+/)[0]) || 0;

		entity.add(Spawn, {
			index,
			position: new Vector3(pos.x, pos.y + 0.5, pos.z)
		});
	},
	track: (entity: Entity, node: Mesh, entities: Entity[]) => {
		let rotate = 0;

		if (node.name.includes('left')) {
			rotate = -90;
		} else if (node.name.includes('right')) {
			rotate = 90;
		}
		entity.add(Track, { rotate });
	},
	cart: (entity: Entity, node: Mesh, entities: Entity[]) => {
		entity.add(Cart);
		entity.remove(CannonBody);
	},
	wicks: (entity: Entity, node: Mesh, entities: Entity[]) => {
		const uniqueId = `${node.name}`;
		entity.add(Rotor);
		entity.add(Synchronize, {
			id: uniqueId,
			components: {
				Transform
			}
		});
	}
};

export const loadMap = (map: GLTF): Entity[] => {
	const entities: Entity[] = [];
	map.scene.traverse(node => {
		// Enable shadows etc on all models
		if (node instanceof Mesh && node.material instanceof Material) {
			node.material = new MeshPhongMaterial({
				color: (node.material as MeshStandardMaterial).color,
				specular: 0
			});

			node.material.flatShading = true;
			node.material.transparent = false;
			node.castShadow = true;
			node.receiveShadow = true;
		}

		// Create entities from course pieces
		if (node.parent == map.scene) {
			const entity = new Entity();
			entity.add(Transform, {
				x: node.position.x,
				y: node.position.y,
				z: node.position.z,
				rx: node.rotation.x,
				ry: node.rotation.y,
				rz: node.rotation.z
			});
			entity.add(node);
			entity.add(CoursePiece);
			entity.add(new TrimeshShape());
			entity.add(new CannonBody(COURSE_BODY));
			entities.push(entity);

			Object.keys(pieceModifiers).forEach(key => {
				if (node.name.toLowerCase().match(key)) pieceModifiers[key](entity, node, entities);
			});
		}
	});

	return entities;
};

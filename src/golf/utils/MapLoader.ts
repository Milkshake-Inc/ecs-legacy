import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '@ecs/ecs/Entity';
import { Mesh, Material, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import Transform from '@ecs/plugins/math/Transform';
import Hole from '../components/Hole';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { Box, Vec3 } from 'cannon-es';
import TrimeshShape from '@ecs/plugins/physics/3d/components/TrimeshShape';
import { COURSE_BODY } from '../constants/Physics';
import CoursePiece from '../components/CoursePiece';
import Spawn from '../components/Spawn';
import Vector3 from '@ecs/plugins/math/Vector';
import Track from '../components/terrain/Track';
import Cart from '../components/terrain/Cart';
import Rotor from '../components/terrain/Rotor';
import Synchronize from '../components/Synchronize';
import Bounds from '../components/Bounds';
import MeshShape from '@ecs/plugins/physics/3d/components/MeshShape';

const pieceModifiers = {
	flag: (entity: Entity, node: Mesh, entities: Entity[]) => {
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
	bounds: (entity: Entity, node: Mesh, entities: Entity[]) => {
		const index = parseInt(node.name.match(/\d+/)[0]) || 0;
		entity.remove(CannonBody);
		entity.add(
			new CannonBody({
				collisionResponse: false // Make bounds collider not collidable. Only used for triggering.
			})
		);
		entity.add(new Bounds(index));
		node.visible = false;
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
	},
	wicks: (entity: Entity, node: Mesh, entities: Entity[]) => {
		const uniqueId = `${node.name}${node.position.toArray()}`;
		entity.add(Rotor);
		entity.add(Synchronize, {
			id: uniqueId,
			components: {
				Transform
			}
		});
	},
	'fence|detail|cart|track|flag|poles': (entity: Entity, node: Mesh, entities: Entity[]) => {
		entity.remove(CoursePiece);
		entity.remove(CannonBody);
		entity.remove(TrimeshShape);
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
				rz: node.rotation.z,
				sx: node.scale.x,
				sy: node.scale.y,
				sz: node.scale.z
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

/* eslint-disable no-prototype-builtins */
import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import Vector3 from '@ecs/math/Vector';
import Vehicle from '../components/Vehicle';
import { Object3D } from 'three';
import Helicopter from '../components/Helicopter';
import { Material } from 'cannon-es';
import GLTFShape from '@ecs/plugins/physics/components/GLTFShape';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';

export default class HelicopterEntity extends Entity {
	constructor(gltf: GLTF, spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		const mat = new Material('Mat');
		mat.friction = 0.01;

		this.add(Transform, { position: spawnPosition });
		this.add(Vehicle);
		this.add(Helicopter, { rotors: this.getRotorsFromModel(gltf) });
		this.add(gltf.scene);
		this.add(
			new CannonBody({
				mass: 50,
				collisionFilterGroup: ~CollisionGroups.Vehicles,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Characters
			})
		);
		this.add(GLTFShape, { gltf });
		this.add(mat);
	}

	public getRotorsFromModel(gltf: GLTF): Object3D[] {
		const rotors = [];
		gltf.scene.traverse(child => {
			if (child.hasOwnProperty('userData')) {
				if (child.userData.hasOwnProperty('data')) {
					if (child.userData.data === 'rotor') {
						rotors.push(child);
					}
				}
			}
		});

		return rotors;
	}
}

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
// import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import SoundFollowTarget from '@ecs/plugins/sound/components/SoundFollowTarget';

export default class HelicopterEntity extends Entity {
	constructor(gltf: GLTF, spawnPosition: Vector3 = Vector3.ZERO, sfx?: string) {
		super();

		const mat = new Material('Mat');
		mat.friction = 0.01;

		if (sfx) {
			this.add(Sound, { src: sfx, loop: true, seek: 0, volume: 2 });
			this.add(SoundFollowTarget, { offset: new Vector3(0, 0, -5) });
		}
		this.add(Transform, { position: spawnPosition });
		this.add(Vehicle);
		this.add(Helicopter, { rotors: this.getRotorsFromModel(gltf) });
		// this.add(InputKeybindings.AIRCRAFT());
		this.add(gltf.scene);
		this.add(
			new CannonBody({
				mass: 50,
				collisionFilterGroup: ~CollisionGroups.Vehicles,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Characters,
				allowSleep: false
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

import Vector3 from '@ecs/math/Vector';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/Transform';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Material } from 'cannon-es';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Vehicle from '../components/Vehicle';
import Boat from '../components/Boat';

export default class BoatEntity extends Entity {
	constructor(gltf: GLTF, spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		const mat = new Material('slippy');
		mat.friction = 0.03;

		this.add(Transform, { position: spawnPosition });
		this.add(InputKeybindings.WASD());
		this.add(Vehicle);
		this.add(Boat);
		this.add(gltf.scene.children[0]);
		this.add(
			new CannonBody({
				mass: 20,
				material: mat,
				collisionFilterGroup: ~CollisionGroups.Vehicles,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Characters,
				allowSleep: false,
				interpolation: true
			})
		);
		this.add(MeshShape);
	}
}

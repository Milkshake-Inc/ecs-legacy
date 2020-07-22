import Vector3 from '@ecs/math/Vector';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/Transform';
// import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Material } from 'cannon-es';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Vehicle from '../components/Vehicle';
import { Mesh } from 'three';
import Galleon, { GalleonData } from '../components/Galleon';
import GLTFShape from '@ecs/plugins/physics/components/GLTFShape';

export default class GalleonEntity extends Entity {
	constructor(gltf: GLTF, spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		const mat = new Material('slippy');
		mat.friction = 0.03;

		this.add(Transform, { position: spawnPosition });
		// this.add(InputKeybindings.WASD());
		this.add(Vehicle);
		this.add(Galleon, { data: this.parseModel(gltf) });
		this.add(gltf.scene);
		this.add(
			new CannonBody({
				mass: 1000,
				material: mat,
				collisionFilterGroup: ~CollisionGroups.Vehicles,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Characters,
				allowSleep: false
			})
		);
		this.add(GLTFShape, { gltf });
	}

	public parseModel(gltf: GLTF): GalleonData {
		const data: GalleonData = {};
		gltf.scene.traverse(child => {
			if (child.name == 'steering') {
				data.SteeringWheel = child as Mesh;
			}

			if (child.name == 'cannon_front') {
				data.FrontCannon = child as Mesh;
			}

			if (child.name == 'cannon_left') {
				data.LeftCannon = child as Mesh;
			}

			if (child.name == 'cannon_right') {
				data.RigthCannon = child as Mesh;
			}
		});

		return data;
	}
}

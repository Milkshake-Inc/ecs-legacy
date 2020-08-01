import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { all, any, makeQuery } from '@ecs/ecs/Query';
import Transform from '@ecs/plugins/math/Transform';
import { AmmoInstance } from '@ecs/plugins/physics/ammo/AmmoPhysicsSystem';
import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import Rotor from '../../components/terrain/Rotor';

export class TerrainAnimationSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Transform), any(Rotor)));
	}

	updateEntityFixed(entity: Entity, deltaTime: number) {
		// TODO
		// This seems to be buggy
		if (entity.has(Rotor)) {
			const rotation = entity.get(AmmoBody).body.getWorldTransform().getRotation();
			const movement = new AmmoInstance.btQuaternion(0, 0, 0, 0);
			movement.setEulerZYX(0.01, 0, 0)
			const newRotation = rotation.op_mulq(movement);

			entity.get(AmmoBody).body.getWorldTransform().setRotation(newRotation);
		}
	}
}

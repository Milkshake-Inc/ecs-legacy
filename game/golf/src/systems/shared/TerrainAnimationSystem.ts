import { Entity } from '@ecs/core/Entity';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { all, any, makeQuery } from '@ecs/core/Query';
import Transform from '@ecs/plugins/math/Transform';
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
			entity.get(AmmoBody).rotate({ x: 0, y: 0, z: 0.01 });
		}
	}
}

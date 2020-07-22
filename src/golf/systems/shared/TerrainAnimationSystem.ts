import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery, all, any } from '@ecs/ecs/Query';
import Transform from '@ecs/plugins/math/Transform';
import Rotor from '../../components/terrain/Rotor';
import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { Vec3 } from 'cannon-es';

export class TerrainAnimationSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Transform), any(Rotor)));
	}

	updateEntityFixed(entity: Entity, deltaTime: number) {
		if (entity.has(Rotor)) {
			entity.get(CannonBody).rotate(new Vec3(0, 0, 0.01));
		}
	}
}

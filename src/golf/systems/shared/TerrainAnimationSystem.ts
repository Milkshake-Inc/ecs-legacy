import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import { useQueries } from '@ecs/ecs/helpers';
import Transform from '@ecs/plugins/Transform';
import Cart from '../../components/terrain/Cart';
import Rotor from '../../components/terrain/Rotor';
import Track from '../../components/terrain/Track';
import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { Vec3 } from 'cannon-es';

export class TerrainAnimationSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		camera: all(Track)
	});

	constructor() {
		super(makeQuery(all(Transform, Rotor)));
	}

	updateEntityFixed(entity: Entity, deltaTime: number) {
		if (entity.has(Rotor)) {
			entity.get(CannonBody).rotate(new Vec3(0, 0, 0.01));
		}
	}
}

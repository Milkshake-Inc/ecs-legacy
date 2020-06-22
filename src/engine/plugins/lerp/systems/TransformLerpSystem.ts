import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import Transform from '@ecs/plugins/Transform';
import { TransfromLerp } from '../components/TransfromLerp';
import { Entity } from '@ecs/ecs/Entity';
import MathHelper from '@ecs/math/MathHelper';

export default class TransformLerpSystem extends IterativeSystem {
	protected multiplier: number;

	constructor(multiplier = 0.4) {
		super(makeQuery(all(Transform, TransfromLerp)));

		this.multiplier = multiplier;
	}

	updateEntity(entity: Entity, deltaTime: number) {
		const target = entity.get(TransfromLerp);
		const current = entity.get(Transform);

		if (!target.position) {
			target.position = current.position.clone();
		}

		current.position = MathHelper.lerpVector3(current.position, target.position, this.multiplier);
		current.scale = MathHelper.lerpVector3(current.scale, target.scale, this.multiplier);
		current.quaternion = current.quaternion.slerp(target.quaternion, this.multiplier);
	}
}

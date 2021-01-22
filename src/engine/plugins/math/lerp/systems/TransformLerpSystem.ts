import { all, System } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import { TransfromLerp } from '../components/TransfromLerp';
import MathHelper from '@ecs/plugins/math/MathHelper';
import { useQueries } from '@ecs/core/helpers';

export default class TransformLerpSystem extends System {
	protected multiplier: number;
	protected queries = useQueries(this, {
		transformLerps: all(Transform, TransfromLerp)
	});

	constructor(multiplier = 0.4) {
		super();
		this.multiplier = multiplier;
	}

	update(dt: number) {
		this.queries.transformLerps.forEach(entity => {
			const target = entity.get(TransfromLerp);
			const current = entity.get(Transform);

			if (!target.position) {
				target.position = current.position.clone();
			}

			current.position = MathHelper.lerpVector3(current.position, target.position, this.multiplier);
			current.scale = MathHelper.lerpVector3(current.scale, target.scale, this.multiplier);
			current.quaternion = current.quaternion.slerp(target.quaternion, this.multiplier);
		});
	}
}

import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Transform from '@ecs/plugins/math/Transform';
import { all, any, makeQuery } from '@ecs/ecs/Query';
import BoundingBox from '../components/ArcadeBoundingBox';
import ArcadeBoundingCircle from '../components/ArcadeBoundingCircle';
import ArcadePhysics from '../components/ArcadePhysics';

export default class BoundsSystem extends IterativeSystem {
	constructor(protected bounds: { width: number; height: number }) {
		super(makeQuery(all(Transform, ArcadePhysics), any(BoundingBox, ArcadeBoundingCircle)));
	}

	protected updateEntity(entity: Entity, dt: number) {
		const position = entity.get(Transform).position;
		const physics = entity.get(ArcadePhysics);

		const boundsComponent = entity.has(BoundingBox) ? entity.get(BoundingBox) : entity.get(ArcadeBoundingCircle);

		const boundsWidth = boundsComponent instanceof BoundingBox ? boundsComponent.size.x : boundsComponent.size;
		const boundsHeight = boundsComponent instanceof BoundingBox ? boundsComponent.size.y : boundsComponent.size;

		// Left
		if (position.x - boundsWidth / 2 < 0) {
			position.x = boundsWidth / 2;

			if (physics.bounce) {
				physics.velocity.x *= -1;
			}
		}

		// Right
		if (position.x + boundsWidth / 2 > this.bounds.width) {
			position.x = this.bounds.width - boundsWidth / 2;

			if (physics.bounce) {
				physics.velocity.x *= -1;
			}
		}

		// Top
		if (position.y - boundsHeight / 2 < 0) {
			position.y = boundsHeight / 2;

			if (physics.bounce) {
				physics.velocity.y *= -1;
			}
		}

		// Bottom
		if (position.y + boundsHeight / 2 > this.bounds.height) {
			position.y = this.bounds.height - boundsHeight / 2;

			if (physics.bounce) {
				physics.velocity.y *= -1;
			}
		}
	}
}

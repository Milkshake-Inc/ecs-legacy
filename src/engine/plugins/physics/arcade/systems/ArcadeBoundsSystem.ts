import { all, any, makeQuery, System } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import BoundingBox from '../components/ArcadeBoundingBox';
import ArcadeBoundingCircle from '../components/ArcadeBoundingCircle';
import ArcadePhysics from '../components/ArcadePhysics';
import { useQueries } from '@ecs/core/helpers';

export default class BoundsSystem extends System {
	protected queries = useQueries(this, {
		boundingEntities: [all(Transform, ArcadePhysics), any(BoundingBox, ArcadeBoundingCircle)]
	});

	constructor(protected bounds: { width: number; height: number }) {
		super();
	}

	update(dt: number) {
		this.queries.boundingEntities.forEach(entity => {
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
		});
	}
}

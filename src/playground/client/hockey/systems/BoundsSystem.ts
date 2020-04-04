import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import BoundingBox from '../components/BoundingBox';
import BoundingCircle from '../components/BoundingCircle';
import Physics from '../components/Physics';

export default class BoundsSystem extends IterativeSystem {
	constructor(protected bounds: { width: number; height: number }) {
		super(makeQuery(all(Position, Physics), any(BoundingBox, BoundingCircle)));
	}

	protected updateEntity(entity: Entity, dt: number) {
		const position = entity.get(Position);
		const physics = entity.get(Physics);

		const boundsComponent = entity.has(BoundingBox) ? entity.get(BoundingBox) : entity.get(BoundingCircle);

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

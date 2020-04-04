import { Entity } from '@ecs/ecs/Entity';
import { ReactionSystem } from '@ecs/ecs/ReactionSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import BoundingCircle from '../components/BoundingCircle';
import Physics from '../components/Physics';

type Circle = {
	x: number;
	y: number;
	radius: number;
};

export default class CollisionSystem extends ReactionSystem {
	constructor() {
		super(makeQuery(all(Position, BoundingCircle, Physics)));
	}

	public update(deltaTime: number) {
		super.update(deltaTime);

		for (const entityA of this.entities) {
			for (const entityB of this.entities) {
				if (entityA != entityB) {
					this.checkCollision(entityA, entityB);
				}
			}
		}
	}

	protected checkCollision(entityA: Entity, entityB: Entity) {
		const entityAComponents = this.getEntityComponents(entityA);
		const entityBComponents = this.getEntityComponents(entityB);

		const collision = this.collideCircle(
			{
				x: entityAComponents.position.x,
				y: entityAComponents.position.y,
				radius: entityAComponents.bounding.size
			},
			{
				x: entityBComponents.position.x,
				y: entityBComponents.position.y,
				radius: entityBComponents.bounding.size
			}
		);

		if (collision) {
			console.log('Collision');
			entityAComponents.physics.velocity.x *= -1;
			entityAComponents.physics.velocity.y *= -1;
		}
	}

	private getEntityComponents(entity: Entity) {
		return {
			position: entity.get(Position),
			bounding: entity.get(BoundingCircle),
			physics: entity.get(Physics)
		};
	}

	collideCircle(circle1: Circle, circle2: Circle) {
		const distanceX = circle1.x - circle2.x;
		const distanceY = circle1.y - circle2.y;

		const radiiSum = circle1.radius / 2 + circle2.radius / 2;

		if (distanceX * distanceX + distanceY * distanceY <= radiiSum * radiiSum) return true;

		return false;
	}
}

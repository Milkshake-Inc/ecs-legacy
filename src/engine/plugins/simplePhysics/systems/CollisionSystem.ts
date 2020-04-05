import { Entity } from '@ecs/ecs/Entity';
import { ReactionSystem } from '@ecs/ecs/ReactionSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Physics from '../components/Physics';
import { Circle, Polygon, Response, Box, testCircleCircle, testPolygonPolygon, testCirclePolygon, testPolygonCircle, Vector } from 'sat';
import Vector2 from '@ecs/math/Vector2';

type Shapes = Circle | Polygon;

export class CollisionShape {
	public static Circle(size: number) {
		return new Circle(undefined, size);
	}

	public static Box(width: number, height: number) {
		return new Box(undefined, width, height).toPolygon();
	}

	constructor(public shape: Shapes) {}
}

export default class CollisionSystem extends ReactionSystem {
	constructor() {
		super(makeQuery(all(Position, CollisionShape)));
	}

	private updateCollisionShape(entity: Entity) {
		const { x, y } = entity.get(Position);
		const { shape } = entity.get(CollisionShape);

		shape.pos.x = x;
		shape.pos.y = y;
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		// Update all collision shapes position
		for (const entity of this.entities) {
			this.updateCollisionShape(entity);
		}

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

		let collision = false;
		const response: Response = new Response();
		response.clear();

		const shapeA = entityAComponents.collision.shape;
		const shapeB = entityBComponents.collision.shape;

		if (shapeA instanceof Circle && shapeB instanceof Circle) {
			collision = testCircleCircle(shapeA, shapeB, response);
		} else if (shapeA instanceof Polygon && shapeB instanceof Polygon) {
			collision = testPolygonPolygon(shapeA, shapeB, response);
		} else if (shapeA instanceof Circle && shapeB instanceof Polygon) {
			collision = testCirclePolygon(shapeA, shapeB, response);
		} else if (shapeA instanceof Polygon && shapeB instanceof Circle) {
			collision = testPolygonCircle(shapeA, shapeB, response);
		} else {
			throw 'Unsupported collision';
		}

		// Hack ATM - Collision response - Should move to own system
		if (collision && response && entityA.has(Physics)) {
			const velocity = new Vector2(entityAComponents.physics.velocity.x, entityAComponents.physics.velocity.y);
			const inverseAngle = new Vector(velocity.x, velocity.y).projectN(response.overlapN);
			inverseAngle.normalize().scale(velocity.magnitude() * 1.2);

			entityAComponents.position.y -= response.overlapV.y;
			entityAComponents.position.x -= response.overlapV.x;

			this.updateCollisionShape(entityA);

			if (response.overlapV.x < 0 || response.overlapV.x > 0) {
				velocity.x = -inverseAngle.x;
			}

			if (response.overlapV.y < 0 || response.overlapV.y > 0) {
				velocity.y = -inverseAngle.y;
			}

			entityAComponents.physics.velocity.set(velocity.x, velocity.y);
		}
	}

	private getEntityComponents(entity: Entity) {
		return {
			position: entity.get(Position),
			collision: entity.get(CollisionShape),
			physics: entity.get(Physics)
		};
	}
}

import { Entity } from '@ecs/ecs/Entity';
import { ReactionSystem } from '@ecs/ecs/ReactionSystem';
import Position from '@ecs/plugins/Position';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import ArcadePhysics from '../components/ArcadePhysics';
import { Circle, Polygon, Response, Box, testCircleCircle, testPolygonPolygon, testCirclePolygon, testPolygonCircle, Vector } from 'sat';
import Vector2 from '@ecs/math/Vector2';
import { ArcadeCollisionShape } from '../components/ArcadeCollisionShape';

export default class ArcadeCollisionSystem extends ReactionSystem {
	constructor() {
		super(makeQuery(all(Position, ArcadeCollisionShape)));
	}

	private updateCollisionShape(entity: Entity) {
		const { x, y } = entity.get(Position);
		const { shape } = entity.get(ArcadeCollisionShape);

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
					// this.checkCollision(entityB, entityA);
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
		if (collision && response && entityA.has(ArcadePhysics)) {
			// if(entityA.get(ArcadePhysics).isStatic) return;

			// const velocity = new Vector2(entityAComponents.physics.velocity.x, entityAComponents.physics.velocity.y);
			// const inverseAngle = new Vector(velocity.x, velocity.y).projectN(response.overlapN);
			// inverseAngle.normalize().scale(velocity.magnitude() * 1.2);

			entityAComponents.position.y -= response.overlapV.y;
			entityAComponents.position.x -= response.overlapV.x;

			entityAComponents.physics.velocity.x = 0;
			entityAComponents.physics.velocity.y = 0;
			entityBComponents.physics.velocity.set(0, 0);

			this.updateCollisionShape(entityA);

			// if (response.overlapV.x < 0 || response.overlapV.x > 0) {
			// 	velocity.x = -inverseAngle.x;
			// }

			// if (response.overlapV.y < 0 || response.overlapV.y > 0) {
			// 	velocity.y = -inverseAngle.y;
			// }

			// entityAComponents.physics.velocity.set(velocity.x, velocity.y);
		}
	}

	private getEntityComponents(entity: Entity) {
		return {
			position: entity.get(Position),
			collision: entity.get(ArcadeCollisionShape),
			physics: entity.get(ArcadePhysics)
		};
	}
}

import { Entity } from '@ecs/core/Entity';
import { ReactionSystem } from '@ecs/core/ReactionSystem';
import Transform from '@ecs/plugins/math/Transform';
import { all, makeQuery } from '@ecs/core/Query';
import ArcadePhysics from '../components/ArcadePhysics';
import { Circle, Polygon, Response, testCircleCircle, testPolygonPolygon, testCirclePolygon, testPolygonCircle } from 'sat';
import { ArcadeCollisionShape } from '../components/ArcadeCollisionShape';

export default class ArcadeCollisionSystem extends ReactionSystem {
	constructor() {
		super(makeQuery(all(Transform, ArcadeCollisionShape)));
	}

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		for (const entityA of this.entities) {
			for (const entityB of this.entities) {
				if (entityA != entityB) {
					this.checkCollision(entityA, entityB);
				}
			}
		}
	}

	protected checkCollision(entityA: Entity, entityB: Entity) {
		const physicsA = entityA.get(ArcadePhysics)
		const physicsB = entityB.get(ArcadePhysics)

		if (physicsA.isStatic && physicsB.isStatic) return;

		let collision = false;
		const response: Response = new Response();
		response.clear();

		const shapeA = entityA.get(ArcadeCollisionShape).shape;
		const shapeB = entityB.get(ArcadeCollisionShape).shape;

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
			// Skip
			if (physicsA.isStatic) return;

			if (!physicsB.isStatic) {
				// Dynamic vs Dnamic?
				response.overlapV.scale(0.5)
			}

			shapeA.pos.y -= response.overlapV.y;
			shapeA.pos.x -= response.overlapV.x;

			physicsA.velocity.x = 0;
			physicsA.velocity.y = 0;
		}
	}

	private getEntityComponents(entity: Entity) {
		return {
			collision: entity.get(ArcadeCollisionShape),
			physics: entity.get(ArcadePhysics)
		};
	}
}

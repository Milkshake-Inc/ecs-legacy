import { Entity, System, all } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import ArcadePhysics from '../components/ArcadePhysics';
import { Circle, Polygon, Response, testCircleCircle, testPolygonPolygon, testCirclePolygon, testPolygonCircle } from 'sat';
import { ArcadeCollisionShape } from '../components/ArcadeCollisionShape';
import { useQueries } from '@ecs/core/helpers';

export default class ArcadeCollisionSystem extends System {
	protected queries = useQueries(this, {
		collisionShapes: all(Transform, ArcadeCollisionShape)
	});

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		for (const entityA of this.queries.collisionShapes) {
			for (const entityB of this.queries.collisionShapes) {
				if (entityA != entityB) {
					this.checkCollision(entityA, entityB);
				}
			}
		}
	}

	protected checkCollision(entityA: Entity, entityB: Entity) {
		const physicsA = entityA.get(ArcadePhysics);
		const physicsB = entityB.get(ArcadePhysics);

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
				response.overlapV.scale(0.5);
			}

			shapeA.pos.y -= response.overlapV.y;
			shapeA.pos.x -= response.overlapV.x;

			physicsA.velocity.x = 0;
			physicsA.velocity.y = 0;
		}
	}
}

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

	private updateCollisionShape(entity: Entity) {
		const { x, y } = entity.get(Transform).position;
		const { shape } = entity.get(ArcadeCollisionShape);

		shape.pos.x = x;
		shape.pos.y = y;
	}

	public updateFixed(dt: number) {
		super.updateFixed(dt);

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

		if(entityAComponents.physics.isStatic && entityBComponents.physics.isStatic) return;

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
			if(entityA.get(ArcadePhysics).isStatic) return;

			// // const velocity = new Vector3(entityAComponents.physics.velocity.x, entityAComponents.physics.velocity.y, 0);
			// // const inverseAngle = new Vector(velocity.x, velocity.y).projectN(response.overlapN);
			// // inverseAngle.normalize().scale(velocity.magnitude() * 1.2);
			// console.log("collision")
			entityAComponents.transform.position.y -= response.overlapV.y;
			entityAComponents.transform.position.x -= response.overlapV.x;

			// entityAComponents.physics.velocity.x = 0;
			// entityAComponents.physics.velocity.y = 0;
			// entityAComponents.physics.velocity.set(0, 0, 0);

			this.updateCollisionShape(entityA);

			console.log("collision")

			// this.updateCollisionShape(entityB);

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
			transform: entity.get(Transform),
			collision: entity.get(ArcadeCollisionShape),
			physics: entity.get(ArcadePhysics)
		};
	}
}

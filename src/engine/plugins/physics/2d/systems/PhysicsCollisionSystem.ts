import { useQueries } from '@ecs/core/helpers';
import { Entity, System, all, QueryPattern, makeQuery } from 'tick-knock';
import PhysicsBody from '../components/PhysicsBody';

export class CollisionEvent {
	constructor(public entityA: Entity, public entityB: Entity) {}
}

export abstract class PhysicsCollisionSystem extends System {
	protected queries = useQueries(this, {
		bodies: all(PhysicsBody)
	});

	constructor(protected queryA: QueryPattern = all(), protected queryB: QueryPattern = all()) {
		super();
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);
		const watch = this.queries.bodies.filter(this.queryA);

		for (const entity of watch) {
			const { collisions } = entity.get(PhysicsBody);

			collisions.forEach(collision => {
				if (this.queryB(collision.entityB)) {
					this.onCollision(collision);
				}
			});
		}
	}

	protected abstract onCollision(collisionEvent: CollisionEvent): void;
}

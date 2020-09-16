import { Entity } from '@ecs/core/Entity';
import { ReactionSystem } from '@ecs/core/ReactionSystem';
import { all, makeQuery, QueryPattern } from '@ecs/core/Query';
import PhysicsBody from '../components/PhysicsBody';

export class CollisionEvent {
	constructor(public entityA: Entity, public entityB: Entity) {}
}

export abstract class PhysicsCollisionSystem extends ReactionSystem {
	constructor(protected queryA: QueryPattern = all(), protected queryB: QueryPattern = all()) {
		super(makeQuery(all(PhysicsBody)));
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);
		const watch = this.query.entities.filter(this.queryA);

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

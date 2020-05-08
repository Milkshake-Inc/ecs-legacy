import { Entity } from '@ecs/ecs/Entity';
import { ReactionSystem } from '@ecs/ecs/ReactionSystem';
import { all, makeQuery, QueryPattern } from '@ecs/utils/QueryHelper';
import PhysicsBody from '../components/PhysicsBody';

export class CollisionEvent {
	constructor(public entityA: Entity, public entityB: Entity) {}
}

export abstract class PhysicsCollisionSystem extends ReactionSystem {
	constructor(protected queryA: QueryPattern = all(), protected queryB: QueryPattern = all()) {
		super(makeQuery(all(PhysicsBody)));
	}

	public updateFixed(deltaTime: number, frameDt: number) {
		super.updateFixed(deltaTime, frameDt);
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

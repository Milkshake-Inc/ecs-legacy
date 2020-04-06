import { all } from '@ecs/utils/QueryHelper';
import { Wall } from '../components/Wall';
import { PhysicsCollisionSystem, CollisionEvent } from '@ecs/plugins/physics/systems/PhysicsCollisionSystem';
import { Puck } from '../components/Puck';
import { Paddle } from '../components/Paddle';

export class PuckSoundSystem extends PhysicsCollisionSystem {
	constructor() {
		super(all(Puck));
	}

	protected onCollision(collisionEvent: CollisionEvent): void {
		if (collisionEvent.entityB.has(Wall)) {
			console.log('I hit a wall');
		}

		if (collisionEvent.entityB.has(Paddle)) {
			console.log('I hit a paddle');
		}
	}
}

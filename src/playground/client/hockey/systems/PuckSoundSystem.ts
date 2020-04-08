import { all } from '@ecs/utils/QueryHelper';
import { Wall } from '../components/Wall';
import { PhysicsCollisionSystem, CollisionEvent } from '@ecs/plugins/physics/systems/PhysicsCollisionSystem';
import { Puck } from '../components/Puck';
import { Paddle } from '../components/Paddle';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { Sound } from '@ecs/plugins/sounds/components/Sound';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Vector2 from '@ecs/math/Vector2';
import MathHelper from '@ecs/math/MathHelper';

export class PuckSoundSystem extends PhysicsCollisionSystem {
	constructor(protected engine: Engine) {
		super(all(Puck));
	}

	protected onCollision(collisionEvent: CollisionEvent): void {
		const { body } = collisionEvent.entityA.get(PhysicsBody);

		const mag = new Vector2(body.velocity.x, body.velocity.y).magnitude();

		const volume = MathHelper.map(0, 25, 0.1, 0.5, mag);

		if (collisionEvent.entityB.has(Wall)) {
			this.playSound('assets/sfx/wall.wav', volume);
		}

		if (collisionEvent.entityB.has(Paddle)) {
			this.playSound('assets/sfx/paddle.wav', volume);
		}
	}

	protected playSound(url: string, volume = 1) {
		this.engine.addEntity(
			new Entity().add(
				Sound.from({
					url,
					autoPlay: true,
					volume
				})
			)
		);
	}
}

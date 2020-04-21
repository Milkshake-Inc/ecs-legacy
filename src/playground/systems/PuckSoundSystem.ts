import { all } from '@ecs/utils/QueryHelper';
import { Wall } from '../components/Wall';
import { PhysicsCollisionSystem, CollisionEvent } from '@ecs/plugins/physics/systems/PhysicsCollisionSystem';
import { Puck } from '../components/Puck';
import { Paddle } from '../components/Paddle';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Random from '@ecs/math/Random';

export class PuckSoundSystem extends PhysicsCollisionSystem {
	protected engine: Engine;

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

		const sound = new Entity();
		sound.add(Sound, { src: 'assets/hockey/hit1.mp3', rate: Random.float(0.7, 1.2) });
		this.engine.addEntity(sound);
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);
		this.engine = engine;
	}
}

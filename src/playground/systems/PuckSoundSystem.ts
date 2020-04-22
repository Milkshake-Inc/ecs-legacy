import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Random from '@ecs/math/Random';
import { CollisionEvent, PhysicsCollisionSystem } from '@ecs/plugins/physics/systems/PhysicsCollisionSystem';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { Paddle } from '../components/Paddle';
import { Puck } from '../components/Puck';
import { Wall } from '../components/Wall';
import { getSound } from '../constants/sound';

export class PuckSoundSystem extends PhysicsCollisionSystem {
	protected engine: Engine;

	constructor() {
		super(all(Puck));
	}

	protected onCollision(collisionEvent: CollisionEvent): void {
		const puckPosition = collisionEvent.entityA.get(Position);

		if (collisionEvent.entityB.has(Wall)) {
			console.log('I hit a wall');

			const sound = new Entity();
			sound.add(Position, { x: puckPosition.x, y: puckPosition.x });
			sound.add(getSound(Random.fromArray(['wallHit1', 'wallHit2', 'wallHit3']), Random.float(0.7, 1.2)));
			this.engine.addEntity(sound);
		}

		if (collisionEvent.entityB.has(Paddle)) {
			console.log('I hit a paddle');

			const sound = new Entity();
			sound.add(Position, { x: puckPosition.x, y: puckPosition.x });
			sound.add(getSound(Random.fromArray(['hit', 'hit2']), Random.float(0.7, 1.2)));
			this.engine.addEntity(sound);
		}
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);
		this.engine = engine;
	}
}

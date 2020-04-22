import ArcadePhysics from '../components/ArcadePhysics';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Position from '@ecs/plugins/Position';
import { QueryBuilder } from '@ecs/ecs/Query';

export default class ArcadePhysicsSystem extends IterativeSystem {
	constructor() {
		super(new QueryBuilder().contains(Position, ArcadePhysics).build());
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const position = entity.get(Position);
		const physics = entity.get(ArcadePhysics);

		position.x += physics.velocity.x * dt;
		position.y += physics.velocity.y * dt;

		physics.velocity.x *= physics.friction;
		physics.velocity.y *= physics.friction;

		if (physics.velocity.x > physics.maxVelocity) physics.velocity.x = physics.maxVelocity;
		if (physics.velocity.y > physics.maxVelocity) physics.velocity.y = physics.maxVelocity;
	}
}

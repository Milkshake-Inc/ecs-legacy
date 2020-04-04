import Physics from '../components/Physics';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Position from '@ecs/plugins/Position';
import { QueryBuilder } from '@ecs/ecs/Query';

export default class PhysicsSystem extends IterativeSystem {
	constructor() {
		super(new QueryBuilder().contains(Position, Physics).build());
	}

	protected updateEntity(entity: Entity, dt: number) {
		const position = entity.get(Position);
		const physics = entity.get(Physics);

		position.x += physics.velocity.x * dt;
		position.y += physics.velocity.y * dt;
	}
}

import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import Moveable from '../components/Moveable';
import Vector2 from '@ecs/math/Vector2';
import { QueryBuilder } from '@ecs/ecs/Query';
import Physics from '../components/Physics';

export default class MovementSystem extends IterativeSystem {
	constructor() {
		super(new QueryBuilder().contains(Input, Moveable).build());
	}

	protected updateEntity(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const physics = entity.get(Physics);
		const moveable = entity.get(Moveable);

		const velocity = Vector2.ZERO;

		if (input.rightDown) velocity.x += moveable.speed;
		if (input.leftDown) velocity.x -= moveable.speed;

		if (input.downDown) velocity.y += moveable.speed;
		if (input.upDown) velocity.y -= moveable.speed;

		physics.velocity = velocity;
	}
}

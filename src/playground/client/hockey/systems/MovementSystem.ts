import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import Moveable from '../components/Moveable';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import { PhysicsBody } from '@ecs/plugins/physics/components/PhysicsBody';
import { Body } from 'matter-js';

export default class MovementSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Input, Moveable, PhysicsBody)));
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const { body } = entity.get(PhysicsBody);
		const moveable = entity.get(Moveable);

		// if (!input.rightDown && !input.leftDown && !input.downDown && !input.upDown) return;

		// const velocity = Vector2.ZERO;

		// if (input.rightDown) velocity.x += moveable.speed;
		// if (input.leftDown) velocity.x -= moveable.speed;

		// if (input.downDown) velocity.y += moveable.speed;
		// if (input.upDown) velocity.y -= moveable.speed;

		const left = input.leftDown ? 1 : 0;
		const right = input.rightDown ? 1 : 0;
		const down = input.downDown ? 1 : 0;
		const up = input.upDown ? 1 : 0;

		Body.applyForce(body, { x: 0, y: 0 }, { x: moveable.speed * (right - left), y: moveable.speed * (down - up) });
	}
}

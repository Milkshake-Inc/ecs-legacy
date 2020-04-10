import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import Moveable from '../components/Moveable';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';

export default class MovementSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Input, Moveable, PhysicsBody)));
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const body = entity.get(PhysicsBody);
		const moveable = entity.get(Moveable);

		const left = input.leftDown ? 1 : 0;
		const right = input.rightDown ? 1 : 0;
		const down = input.downDown ? 1 : 0;
		const up = input.upDown ? 1 : 0;

		body.applyForce({ x: 0, y: 0 }, { x: moveable.speed * (right - left), y: moveable.speed * (down - up) });
	}
}

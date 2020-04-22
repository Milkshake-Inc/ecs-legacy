import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Input from '@ecs/plugins/input/components/Input';
import Session from '@ecs/plugins/net/components/Session';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Moveable from '../components/Moveable';

export default class MovementSystem extends IterativeSystem {
	static updateEntityFixed(entity: Entity, dt: number) {
		const body = entity.get(PhysicsBody);
		const moveable = entity.get(Moveable);
		const input = entity.get(Input);

		if (input) {
			const left = input.leftDown ? 1 : 0;
			const right = input.rightDown ? 1 : 0;
			const down = input.downDown ? 1 : 0;
			const up = input.upDown ? 1 : 0;

			body.applyForce({ x: 0, y: 0 }, { x: moveable.speed * (right - left), y: moveable.speed * (down - up) });
		}
	}

	constructor() {
		super(makeQuery(all(Session, Moveable, PhysicsBody, Input)));
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		MovementSystem.updateEntityFixed(entity, dt);
	}
}

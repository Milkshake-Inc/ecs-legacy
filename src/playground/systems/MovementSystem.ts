import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import Input, { InputHistory } from '@ecs/plugins/input/components/Input';
import Moveable from '../components/Moveable';
import { makeQuery, all, any } from '@ecs/utils/QueryHelper';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Session from '@ecs/plugins/net/components/Session';

export default class MovementSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Session, Moveable, PhysicsBody), any(Input, InputHistory)));
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const session = entity.get(Session);
		const body = entity.get(PhysicsBody);
		const moveable = entity.get(Moveable);

		let input = entity.get(Input);
		// must be server
		if (!input) {
			const history = entity.get(InputHistory);

			if (history.inputs[session.serverTick]) {
				// set input from player history
				input = history.inputs[session.serverTick];
			} else {
				// Set the last sent input & reuse that
				const keys = Object.keys(history.inputs);
				const frame = keys.pop();
				input = history.inputs[frame];
				console.warn(`⚠️  Missing player input - using last input ${frame}`);
			}
		}

		if (input) {
			const left = input.leftDown ? 1 : 0;
			const right = input.rightDown ? 1 : 0;
			const down = input.downDown ? 1 : 0;
			const up = input.upDown ? 1 : 0;

			body.applyForce({ x: 0, y: 0 }, { x: moveable.speed * (right - left), y: moveable.speed * (down - up) });
		}
	}
}

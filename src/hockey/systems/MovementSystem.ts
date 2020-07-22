import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Input from '@ecs/plugins/input/components/Input';
import Session from '@ecs/plugins/net/components/Session';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Moveable from '../components/Moveable';
import { useState } from '@ecs/ecs/helpers';
import Keyboard from '@ecs/input/Keyboard';
import { KeySet } from '@ecs/input/Control';

export default class MovementSystem extends IterativeSystem {
	protected inputs = useState(
		this,
		new Input({
			move: Keyboard.direction(KeySet.WASD)
		})
	);

	constructor() {
		super(makeQuery(all(Session, Moveable, PhysicsBody, Input)));
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const body = entity.get(PhysicsBody);
		const moveable = entity.get(Moveable);
		const input = entity.get(Input);

		if (input) {
			body.applyForce({ x: 0, y: 0 }, { x: moveable.speed * this.inputs.state.move.x, y: moveable.speed * this.inputs.state.move.y });
		}
	}
}

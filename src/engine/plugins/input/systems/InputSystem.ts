import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Keyboard from '@ecs/input/Keyboard';
import { QueryBuilder } from '@ecs/ecs/Query';
import Input from '../components/Input';
import { Entity } from '@ecs/ecs/Entity';
import Key from '@ecs/input/Key';

export class InputSystem extends IterativeSystem {
	keyboard: Keyboard;

	constructor() {
		super(new QueryBuilder().contains(Input).build());

		this.keyboard = new Keyboard();
	}

	public update(dt: number) {
		super.update(dt);

		this.keyboard.update(dt);
	}

	protected updateEntity(entity: Entity, dt: number) {
		const input = entity.get(Input);

		input.rightDown = this.keyboard.isDown(input.rightKeybinding);
		input.leftDown = this.keyboard.isDown(input.leftKeybinding);

		input.upDown = this.keyboard.isDown(input.upKeybinding);
		input.downDown = this.keyboard.isDown(input.downKeybinding);

		input.jumpDown = this.keyboard.isDown(Key.SPACEBAR) || this.keyboard.isDown(Key.W);
		input.fireDown = this.keyboard.isDown(Key.E);
	}
}

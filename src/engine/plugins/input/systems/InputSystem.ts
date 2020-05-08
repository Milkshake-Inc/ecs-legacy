import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Keyboard from '@ecs/input/Keyboard';
import { QueryBuilder } from '@ecs/ecs/Query';
import Input from '../components/Input';
import { Entity } from '@ecs/ecs/Entity';
import Key from '@ecs/input/Key';
import InputKeybindings from '../components/InputKeybindings';

export class InputSystem extends IterativeSystem {
	defaultKeybindings: InputKeybindings = InputKeybindings.BOTH();
	keyboard: Keyboard;

	constructor() {
		super(new QueryBuilder().contains(Input).build());

		this.keyboard = new Keyboard();
	}

	public updateFixed(dt: number, frameDt: number) {
		super.updateFixed(dt, frameDt);

		this.keyboard.update();
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const keyBindings = entity.has(InputKeybindings) ? entity.get(InputKeybindings) : this.defaultKeybindings;

		input.rightDown = this.keyboard.isEitherDown(keyBindings.rightKeybinding);
		input.leftDown = this.keyboard.isEitherDown(keyBindings.leftKeybinding);

		input.upDown = this.keyboard.isEitherDown(keyBindings.upKeybinding);
		input.downDown = this.keyboard.isEitherDown(keyBindings.downKeybinding);

		input.jumpDown = this.keyboard.isEitherPressed(keyBindings.jumpKeybinding);
		input.fireDown = this.keyboard.isDown(Key.E);

		input.pitchUpDown = this.keyboard.isEitherDown(keyBindings.pitchUpKeybinding);
		input.pitchDownDown = this.keyboard.isEitherDown(keyBindings.pitchDownKeybinding);

		input.yawRightDown = this.keyboard.isEitherDown(keyBindings.yawRightKeybinding);
		input.yawLeftDown = this.keyboard.isEitherDown(keyBindings.yawLeftKeybinding);
	}
}

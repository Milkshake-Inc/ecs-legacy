import { Key, KeySetTemplate, Control } from './Control';
import InputManager from './InputManager';
import InputDevice, { PressedState } from './InputDevice';

export default class Keyboard extends InputDevice {
	protected get listeners() {
		return {
			keydown: function (e) {
				this.handleKeyboardDown(e);
			}.bind(this),
			keyup: function (e) {
				this.handleKeyboardUp(e);
			}.bind(this)
		};
	}

	static key(key: Key): Control {
		return (input: InputManager, playerIndex: number) => {
			const keyboard = input.keyboards[0];
			return {
				down: keyboard.isDown(key),
				once: keyboard.isDownOnce(key)
			};
		};
	}

	static direction(keySet: KeySetTemplate): Control {
		return (input: InputManager, playerIndex: number) => {
			const keyboard = input.keyboards[0];
			const down = { x: 0, y: 0 };
			if (keyboard.isDown(keySet.Up)) down.y -= 1;
			if (keyboard.isDown(keySet.Left)) down.x -= 1;
			if (keyboard.isDown(keySet.Down)) down.y += 1;
			if (keyboard.isDown(keySet.Right)) down.x += 1;

			const once = { x: 0, y: 0 };
			if (keyboard.isDownOnce(keySet.Up)) once.y -= 1;
			if (keyboard.isDownOnce(keySet.Left)) once.x -= 1;
			if (keyboard.isDownOnce(keySet.Down)) once.y += 1;
			if (keyboard.isDownOnce(keySet.Right)) once.x += 1;

			return {
				down: Boolean(down.x != 0 || down.y != 0),
				once: Boolean(once.x != 0 || once.y != 0),
				x: down.x,
				y: down.y
			};
		};
	}

	private handleKeyboardDown({ keyCode }: KeyboardEvent) {
		this.pressed.set(keyCode, this.pressed.has(keyCode) ? null : PressedState.Down);
		return false;
	}

	private handleKeyboardUp({ keyCode }: KeyboardEvent) {
		this.pressed.set(keyCode, PressedState.Up);
		return false;
	}
}

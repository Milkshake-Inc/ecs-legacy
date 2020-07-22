import { Button, Control, GamepadStick } from './Control';
import MathHelper from '@ecs/math/MathHelper';
import InputManager from './InputManager';
import InputDevice, { PressedState } from './InputDevice';

export default class Gamepad extends InputDevice {
	public padIndex: number;

	constructor(padIndex: number) {
		super();
		this.padIndex = padIndex;
	}

	get pad() {
		return navigator.getGamepads()[this.padIndex];
	}

	protected get listeners() {
		return {};
	}

	static button(btn: Button): Control {
		return (input: InputManager, playerIndex: number) => {
			return {
				down: input.gamepads[playerIndex]?.isDown(btn),
				once: input.gamepads[playerIndex]?.isDownOnce(btn)
			};
		};
	}

	static stick(stick: GamepadStick): Control {
		return (input: InputManager, playerIndex: number) => {
			const pad = input.gamepads[playerIndex]?.pad;
			if (!pad) {
				return { down: false, once: false, x: 0, y: 0 };
			}

			const axis = { x: MathHelper.deadzone(pad.axes[stick.xAxis]), y: MathHelper.deadzone(pad.axes[stick.yAxis]) };

			return {
				down: Boolean(axis.x != 0 || axis.y != 0),
				once: Boolean(axis.x != 0 || axis.y != 0),
				x: axis.x,
				y: axis.y
			};
		};
	}

	public update(deltaTime: number) {
		super.update(deltaTime);

		if (!this.pad) return;
		// Update any existing pressed buttons
		for (const btn of Array.from(this.pressed.keys())) {
			if (this.isDownOnce(btn)) this.pressed.set(btn, null);
			if (this.isUpOnce(btn)) this.pressed.delete(btn);
		}

		// Add any new buttons that have been pressed since last update
		for (let btn = 0; btn < this.pad.buttons.length - 1; btn++) {
			const pressed = this.pad.buttons[btn].pressed;
			if (pressed && !this.pressed.has(btn)) {
				this.pressed.set(btn, PressedState.Down);
			}

			if (!pressed && this.pressed.has(btn)) {
				this.pressed.set(btn, PressedState.Up);
			}
		}
	}
}

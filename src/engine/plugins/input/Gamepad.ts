import { GamepadButton, Control, GamepadStick, InputStateEmpty } from './Control';
import MathHelper from '@ecs/plugins/math/MathHelper';
import InputManager from './InputManager';
import InputDevice, { PressedState } from './InputDevice';

const DeviceSensitivity = 0.02;

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

	static button(btn: GamepadButton, playerIndex = 0): Control {
		return (input: InputManager) => {
			return {
				down: input.gamepads[playerIndex]?.isDown(btn),
				once: input.gamepads[playerIndex]?.isDownOnce(btn),
				up: input.gamepads[playerIndex]?.isUpOnce(btn)
			};
		};
	}

	static stick(stick: GamepadStick, playerIndex = 0, sensitivityX = 1, sensitivityY = 1): Control {
		return (input: InputManager) => {
			const pad = input.gamepads[playerIndex]?.pad;
			if (!pad) {
				return InputStateEmpty;
			}

			const axis = { x: MathHelper.deadzone(pad.axes[stick.xAxis]), y: MathHelper.deadzone(pad.axes[stick.yAxis]) };

			return {
				down: Boolean(axis.x != 0 || axis.y != 0),
				once: Boolean(axis.x != 0 || axis.y != 0),
				up: Boolean(axis.x != 0 || axis.y != 0),
				x: axis.x * DeviceSensitivity * sensitivityX,
				y: axis.y * DeviceSensitivity * sensitivityY
			};
		};
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		if (!this.pad) return;

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

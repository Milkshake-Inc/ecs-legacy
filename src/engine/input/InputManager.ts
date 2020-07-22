import Keyboard from './Keyboard';
import Gamepad from './Gamepad';
import Mouse from './Mouse';

export default class InputManager {
	public keyboards: Keyboard[] = [];
	public gamepads: Gamepad[] = [];
	public mouses: Mouse[] = [];

	private listeners: { [event: string]: EventListener } = {
		gamepadconnected: function () {
			this.refreshGamepads();
		}.bind(this),
		gamepaddisconnected: function () {
			this.refreshGamepads();
		}.bind(this)
	};

	constructor() {
		// TODO Figure out some kind of virtual keyboard interface for localplayer split keys...
		this.keyboards = [new Keyboard()];
		this.mouses = [new Mouse()];
		this.refreshGamepads();
		this.addListeners();
	}

	private refreshGamepads() {
		this.gamepads = [];

		for (const gp of navigator.getGamepads()) {
			if (gp) {
				this.gamepads[gp.index] = new Gamepad(gp.index);
			}
		}
	}

	private addListeners() {
		for (const event of Object.keys(this.listeners)) {
			window.addEventListener(event, this.listeners[event], false);
		}
	}

	private removeListeners() {
		for (const event of Object.keys(this.listeners)) {
			window.removeEventListener(event, this.listeners[event]);
		}
	}

	public update(deltaTime: number) {
		for (const input of this.keyboards) {
			if (input) input.update(deltaTime);
		}

		for (const input of this.gamepads) {
			if (input) input.update(deltaTime);
		}
	}

	public destroy() {
		this.removeListeners();
	}
}

import Keyboard from './Keyboard';
import Gamepad from './Gamepad';
import Mouse from './Mouse';
import Touch from './Touch';

export default class InputManager {
	public keyboard: Keyboard;
	public mouse: Mouse;
	public touch: Touch;
	public gamepads: Gamepad[] = [];

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
		this.keyboard = new Keyboard();
		this.mouse = new Mouse();
		this.touch = new Touch();

		this.keyboard.setup();
		if (InputManager.isTouchCapable) {
			this.touch.setup();
		} else {
			this.mouse.setup();
		}

		this.refreshGamepads();
		this.addListeners();
	}

	static get isTouchCapable() {
		return (
			'ontouchstart' in window ||
			(window['DocumentTouch'] && document instanceof window['DocumentTouch']) ||
			navigator.maxTouchPoints > 0 ||
			window.navigator.msMaxTouchPoints > 0
		);
	}

	private refreshGamepads() {
		this.gamepads = [];

		for (const gp of navigator.getGamepads()) {
			if (gp) {
				this.gamepads[gp.index] = new Gamepad(gp.index);
				this.gamepads[gp.index].setup();
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
		this.keyboard.update(deltaTime);
		this.mouse.update(deltaTime);
		this.touch.update(deltaTime);

		for (const input of this.gamepads) {
			if (input) input.update(deltaTime);
		}
	}

	public destroy() {
		this.removeListeners();
	}
}

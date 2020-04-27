export default class Keyboard {
	private KEY_UP_EVENT = 'keyup';
	private KEY_DOWN_EVENT = 'keydown';

	private isEnabled = false;
	private pressedKeys = [];
	private releasedKeys = [];
	private downKeys = [];
	private preventDefaultKeys = [];

	constructor() {
		this.isEnabled = false;
		this.pressedKeys = [];
		this.releasedKeys = [];
		this.downKeys = [];

		this.preventDefaultKeys = [];

		this.enable();
	}

	public enable() {
		if (!this.isEnabled) {
			this.isEnabled = true;
			this.enableEvents();
		}
	}

	public isDown(key: number) {
		return this.downKeys.indexOf(key) !== -1;
	}

	public isEitherDown(keys: number[]) {
		return keys.some(key => this.isDown(key));
	}

	public isPressed(key: number) {
		return !!this.pressedKeys[key];
	}

	public isReleased(key: number) {
		return !!this.releasedKeys[key];
	}

	public update() {
		this.pressedKeys = [];
		this.releasedKeys = [];
	}

	public disable() {
		if (this.isEnabled) {
			this.isEnabled = false;
			this.disableEvents();
		}
	}

	private disableEvents() {
		window.removeEventListener(this.KEY_DOWN_EVENT, this.onKeyDown, true);
		window.removeEventListener(this.KEY_UP_EVENT, this.onKeyUp, true);
	}

	private enableEvents() {
		window.addEventListener(this.KEY_DOWN_EVENT, this.onKeyDown.bind(this), true);
		window.addEventListener(this.KEY_UP_EVENT, this.onKeyUp.bind(this), true);
	}

	private onKeyDown(event: KeyboardEvent) {
		const key = event.which || event.keyCode;
		if (this.preventDefaultKeys[key]) {
			event.preventDefault();
		}

		if (!this.isDown(key)) {
			this.downKeys.push(key);
			this.pressedKeys[key] = true;
		}
	}

	private onKeyUp(event: KeyboardEvent) {
		const key = event.which || event.keyCode;
		if (this.preventDefaultKeys[key]) {
			event.preventDefault();
		}

		if (this.isDown(key)) {
			this.pressedKeys[key] = false;
			this.releasedKeys[key] = true;

			const index = this.downKeys.indexOf(key);

			if (index !== -1) {
				this.downKeys.splice(index, 1);
			}
		}
	}
}

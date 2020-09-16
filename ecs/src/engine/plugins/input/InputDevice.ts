export enum PressedState {
	Down = 'down',
	Up = 'up'
}

export default abstract class InputDevice {
	protected pressed: Map<any, PressedState.Down | PressedState.Up> = new Map();
	private _lastFramePressed: Map<any, PressedState.Down | PressedState.Up> = new Map();

	protected abstract get listeners(): { [event: string]: any };

	public active: boolean;

	public update(deltaTime: number) {
		this._lastFramePressed = this.pressed;
		for (const [key] of this.pressed) {
			if (this.isDownOnce(key)) this.pressed.set(key, null);
			if (this.isUpOnce(key)) this.pressed.delete(key);
		}
	}

	public isDown(btn: any) {
		return this._lastFramePressed.has(btn);
	}

	public isDownOnce(btn: any) {
		return this._lastFramePressed.get(btn) == PressedState.Down;
	}

	public isUpOnce(btn: any) {
		return this._lastFramePressed.get(btn) == PressedState.Up;
	}

	public setup() {
		this.addListeners();
		this.active = true;
	}

	public destroy() {
		this.removeListeners();
		this.active = false;
	}

	protected addListeners() {
		for (const event of Object.keys(this.listeners)) {
			window.addEventListener(event, this.listeners[event], false);
		}
	}

	protected removeListeners() {
		for (const event of Object.keys(this.listeners)) {
			window.removeEventListener(event, this.listeners[event]);
		}
	}
}

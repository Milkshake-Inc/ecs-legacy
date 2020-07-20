import { InputBindings, Actions, MouseAxis, GamepadButtons, DeviceBindings } from './types';
import { keyCodes, mouseButtonCodes, buttonNameLookup, axisNameLookup, buttonsAsAxisLookup } from './constants';

// https://github.com/CharlotteGore/Hassle-Input
export class Input<D extends string | number, A extends string | number, T extends string | number> {
	private bindings: InputBindings<D, A, T>;
	private gamepadStatus: Actions<D, A, T>;
	private keyboardStatus: Actions<D, A, T>;
	private mouseStatus: Actions<D, A, T>;
	private status: Actions<D, A, T>;
	private mouseActiveElement: HTMLElement;
	private mouseWheelDeltas: Array<number>;
	private gamepads: Array<Gamepad>;
	private prevGamepads: Array<string>;
	private gamepadTimestamps: Array<number>;
	private prevGamepadTimestamps: Array<number>;
	private shouldPollGamepads: boolean;

	constructor() {
		this.bindings = null;
		this.status = null;
		this.mouseActiveElement = null;
		this.mouseWheelDeltas = [];
		this.gamepads = [];
		this.prevGamepads = [];
		this.gamepadTimestamps = [];
		this.shouldPollGamepads = !('ongamepadconnected' in window);
		return this;
	}
	/**
	 * binds controls to specific actions
	 *
	 * @param {InputBindings<D, A, T>} bindings D is Digital Actions, A is Analog Actions and T is Touch Actions.
	 */

	bindActions = (bindings: InputBindings<D, A, T>): void => {
		this.bindings = bindings;

		// we need to keep the device statuses separate to avoid conficts.
		this.gamepadStatus = this.parseBindings(bindings.gamepad);
		this.keyboardStatus = this.parseBindings(bindings.keys);
		this.mouseStatus = this.parseBindings(bindings.mouse);

		// let's aggregate all the bindings into one global status object
		this.status = [bindings.gamepad, bindings.mouse, bindings.keys].reduce(
			(status, deviceBindings) => {
				const deviceStatus = this.parseBindings(deviceBindings);
				return {
					digital: Object.assign({}, status.digital, deviceStatus.digital),
					analog: Object.assign({}, status.analog, deviceStatus.analog),
					touch: Object.assign({}, status.touch)
				};
			},
			{
				digital: {},
				analog: {},
				touch: {}
			} as Actions<D, A, T>
		);

		if (navigator.maxTouchPoints > 0 && bindings.touch) {
			if (bindings.touch.enabled) {
				this.status.digital[bindings.touch.enabled] = 0;
			}
			if (bindings.touch.touches) {
				this.status.touch[bindings.touch.touches] = {};
				for (let i = 0; i < navigator.maxTouchPoints; i++) {
					this.status.touch[bindings.touch.touches][i] = {
						active: false,
						x: 0,
						y: 0
					};
				}
			}
		}
	};

	private parseBindings = (deviceBindings: DeviceBindings<D, A, T> | null): Actions<D, A, T> | null => {
		if (deviceBindings === null) return null;

		const status = {
			digital: {},
			analog: {},
			touch: {}
		} as Actions<D, A, T>;

		if (deviceBindings.buttons) {
			for (const value of Object.values(deviceBindings.buttons)) {
				status.digital[value] = 0;
			}
		}
		if (deviceBindings.axis) {
			for (const value of Object.values(deviceBindings.axis)) {
				status.analog[value] = 0;
			}
		}
		if (deviceBindings.enabled) {
			status.digital[deviceBindings.enabled] = 0;
		}
		return status;
	};

	/**
	 * Specifies the DOM element for use as a reference for mouse and touch actions. Without this
	 * mouse move events and touch events are not available.
	 *
	 * @param {HTMLElement} element a DOM element to bind mouse and touch events to.
	 */

	setMouseAndTouchActiveElement = (element: HTMLElement) => {
		this.mouseActiveElement = element;
	};

	/**
	 * Returns the current active status for all actions
	 *
	 * @returns {Actions<D, A, T>} status object for all actions
	 */

	getActionStatus = (): Readonly<Actions<D, A, T>> => {
		return this.status;
	};

	/**
	 * Causes the Input instance to begin monitoring device inputs.
	 *
	 */

	initialize = () => {
		if (!this.bindings || !this.status) {
			throw new Error('Input cannot be initialized without Input Bindings');
		}
		window.addEventListener('keydown', this.handleKeyDown, false);
		window.addEventListener('keyup', this.handleKeyUp, false);
		window.addEventListener('mousedown', this.handleMouseDown, false);
		window.addEventListener('mouseup', this.handleMouseUp, false);
		window.addEventListener('wheel', this.handleMouseWheel, false);
		if (!this.shouldPollGamepads) {
			window.addEventListener('gamepadconnected', this.handleGamepadConnected, false);
			window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected, false);
		}
		if (this.mouseActiveElement) {
			this.mouseActiveElement.addEventListener('mouseover', this.handleMouseCursorActive, false);
			this.mouseActiveElement.addEventListener('mouseout', this.handleMouseCursorInactive, false);
			if (navigator.maxTouchPoints > 0) {
				this.mouseActiveElement.addEventListener('touchstart', this.handleTouchStart, false);
				this.mouseActiveElement.addEventListener('touchend', this.handleTouchEnd, false);
				this.mouseActiveElement.addEventListener('touchmove', this.handleTouchMove, false);
			}
		}
	};

	/**
	 * Causes the Input instance to update polled devices (including mouse wheels)
	 *
	 */
	update = (): void => {
		// Update mouse wheel deltas
		const mouseBindings = this.bindings.mouse;
		const padBindings = this.bindings.gamepad;

		if (mouseBindings && mouseBindings.axis[MouseAxis.Wheel]) {
			this.mouseStatus.analog[mouseBindings.axis[MouseAxis.Wheel]] = this.mouseWheelDeltas.reduce((sum, a) => sum + a, 0);
			this.mouseWheelDeltas = [];
		}

		// we have a game pad? and we're interested in the game pad?
		if (padBindings) {
			if (this.shouldPollGamepads) {
				this.pollGamepads();
			}
			if (this.gamepads.length) {
				this.updateGamepad();
			}
		}

		// reset all the statuses to 0
		this.status.analog = Object.keys(this.status.analog).reduce((status, key) => {
			status[key as A] = 0;
			return status;
		}, this.status.analog);

		this.status.digital = Object.keys(this.status.digital).reduce((status, key) => {
			status[key as D] = 0;
			return status;
		}, this.status.digital);

		// merge all the statuses together
		this.status = [this.gamepadStatus, this.mouseStatus, this.keyboardStatus].reduce((status, deviceStatus) => {
			for (const [key, value] of Object.entries<number>(deviceStatus.digital)) {
				if (value === 1) status.digital[key as D] = 1;
			}
			for (const [key, value] of Object.entries<number>(deviceStatus.analog)) {
				if (value !== 0) status.analog[key as A] = value;
			}
			return this.status;
		}, this.status);
	};

	/**
	 * Causes the Input instance to stop monitoring devices.
	 *
	 */
	destroy = () => {
		window.removeEventListener('keydown', this.handleKeyDown, false);
		window.removeEventListener('keyup', this.handleKeyUp, false);
		window.removeEventListener('mousedown', this.handleMouseDown, false);
		window.removeEventListener('mouseup', this.handleMouseUp, false);
		window.removeEventListener('wheel', this.handleMouseWheel, false);
		if (!this.shouldPollGamepads) {
			window.removeEventListener('gamepadconnected', this.handleGamepadConnected, false);
			window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected, false);
		}

		if (this.mouseActiveElement) {
			this.mouseActiveElement.removeEventListener('mouseover', this.handleMouseCursorActive, false);
			this.mouseActiveElement.removeEventListener('mouseout', this.handleMouseCursorInactive, false);
			if (navigator.maxTouchPoints > 0) {
				this.mouseActiveElement.removeEventListener('touchstart', this.handleTouchStart, false);
				this.mouseActiveElement.removeEventListener('touchend', this.handleTouchEnd, false);
				this.mouseActiveElement.removeEventListener('touchmove', this.handleTouchMove, false);
			}
		}
	};

	private pollGamepads = () => {
		const rawGamepads = navigator.getGamepads();
		this.gamepads = [];
		for (let i = 0; i < rawGamepads.length; i++) {
			if (rawGamepads[i]) {
				this.gamepads.push(rawGamepads[i]);
				if (!this.gamepadTimestamps[i]) this.gamepadTimestamps[i] = 0;
			}
		}
	};

	private updateGamepad = () => {
		const { timestamp, buttons, axes } = this.gamepads[0];
		if (timestamp > this.gamepadTimestamps[0]) {
			console.log('gamepad status changed');
			const buttonBindings = this.bindings.gamepad.buttons || null;
			const axisBindings = this.bindings.gamepad.axis || null;

			for (let i = 0; i < buttons.length; i++) {
				const button = buttons[i];
				if (buttonBindings && buttonNameLookup[i] && buttonBindings[buttonNameLookup[i]]) {
					this.gamepadStatus.digital[buttonBindings[buttonNameLookup[i]]] = button.value > 0 ? 1 : 0;
				}
				if (axisBindings && buttonsAsAxisLookup[i] && axisBindings[buttonsAsAxisLookup[i]]) {
					this.gamepadStatus.analog[axisBindings[buttonsAsAxisLookup[i]]] = button.value;
				}
			}
			for (let i = 0; i < axes.length; i++) {
				const axis = axes[i];
				if (axisBindings && axisNameLookup[i] && axisBindings[axisNameLookup[i]]) {
					this.gamepadStatus.analog[axisBindings[axisNameLookup[i]]] = axis;
				}
			}
			this.gamepadTimestamps[0] = timestamp;
		}
	};

	private handleKeyDown = (e: KeyboardEvent) => {
		e.preventDefault();
		const bindings = this.bindings.keys;
		if (bindings && bindings.buttons && bindings.buttons[keyCodes[e.which]]) {
			this.keyboardStatus.digital[bindings.buttons[keyCodes[e.which]]] = 1;

			// if the user wants to know when the keyboard is active...
			if (bindings.enabled) {
				this.keyboardStatus.digital[bindings.enabled] = 1;
			}
		}
	};

	private handleKeyUp = (e: KeyboardEvent) => {
		e.preventDefault();
		const bindings = this.bindings.keys;
		if (bindings && bindings.buttons && bindings.buttons[keyCodes[e.which]]) {
			this.keyboardStatus.digital[bindings.buttons[keyCodes[e.which]]] = 0;

			// a key up still counts as keyboard activity
			if (bindings.enabled) {
				this.keyboardStatus.digital[bindings.enabled] = 1;
			}
		}
	};

	private handleMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		const bindings = this.bindings.mouse;
		if (bindings && bindings.buttons && bindings.buttons[mouseButtonCodes[e.which]]) {
			this.mouseStatus.digital[bindings.buttons[mouseButtonCodes[e.which]]] = 1;
		}
	};

	private handleMouseUp = (e: MouseEvent) => {
		e.preventDefault();
		const bindings = this.bindings.mouse;
		if (bindings && bindings.buttons && bindings.buttons[mouseButtonCodes[e.which]]) {
			this.mouseStatus.digital[bindings.buttons[mouseButtonCodes[e.which]]] = 0;
		}
	};

	private handleTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		const bindings = this.bindings.touch;
		if (bindings && bindings.touches) {
			for (const changed of Array.from(e.changedTouches)) {
				const x = ((changed.clientX - (e.target as HTMLElement).offsetLeft) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				const y = (1 - (changed.clientY - (e.target as HTMLElement).offsetTop) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				this.status.touch[bindings.touches][changed.identifier] = {
					active: true,
					x,
					y
				};
			}
		}
	};

	private handleTouchMove = (e: TouchEvent) => {
		e.preventDefault();
		const bindings = this.bindings.touch;
		if (bindings && bindings.touches) {
			for (const changed of Array.from(e.changedTouches)) {
				const x = ((changed.clientX - (e.target as HTMLElement).offsetLeft) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				const y = (1 - (changed.clientY - (e.target as HTMLElement).offsetTop) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				this.status.touch[bindings.touches][changed.identifier] = {
					active: true,
					x,
					y
				};
			}
		}
	};

	private handleTouchEnd = (e: TouchEvent) => {
		e.preventDefault();
		const bindings = this.bindings.touch;
		if (bindings && bindings.touches) {
			for (const changed of Array.from(e.changedTouches)) {
				const x = ((changed.clientX - (e.target as HTMLElement).offsetLeft) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				const y = (1 - (changed.clientY - (e.target as HTMLElement).offsetTop) / (e.target as HTMLElement).clientWidth) * 2 - 1;
				this.status.touch[bindings.touches][changed.identifier] = {
					active: false,
					x,
					y
				};
			}
		}
	};

	private handleMouseCursorActive = (e: MouseEvent) => {
		const bindings = this.bindings.mouse;
		if (bindings && bindings.enabled) {
			this.mouseStatus.digital[this.bindings.mouse.enabled] = 1;
		}
		this.mouseActiveElement.addEventListener('mousemove', this.handleMouseMove, false);
	};

	private handleMouseCursorInactive = (e: MouseEvent) => {
		const bindings = this.bindings.mouse;
		if (bindings && bindings.enabled) {
			this.mouseStatus.digital[this.bindings.mouse.enabled] = 0;
		}
		this.mouseActiveElement.removeEventListener('mousemove', this.handleMouseMove, false);
	};

	private handleMouseMove = (e: MouseEvent) => {
		const bindings = this.bindings.mouse;
		if (bindings && bindings.axis) {
			const x = ((e.clientX - (e.target as HTMLElement).offsetLeft) / (e.target as HTMLElement).clientWidth) * 2 - 1;
			const y = (1 - (e.clientY - (e.target as HTMLElement).offsetTop) / (e.target as HTMLElement).clientWidth) * 2 - 1;
			if (bindings.axis.X) {
				this.mouseStatus.analog[bindings.axis.X] = x;
			}
			if (bindings.axis.Y) {
				this.mouseStatus.analog[bindings.axis.Y] = y;
			}
		}
	};

	private handleMouseWheel = (e: MouseWheelEvent) => {
		e.preventDefault();
		// there is no brilliant way to normalize mouse wheel deltas
		// as far as I know so I'm doing it this naive way, one ping =
		// one +1 or -1. Deltas are collected and summed on Update to
		// get the total delta for a particular frame. Probably only
		// likely to be one at a time but this is a way of 'latching' the
		// inputs.
		this.mouseWheelDeltas.push(e.deltaY > 0 ? 1 : -1);
	};

	private handleGamepadConnected = (e: GamepadEvent) => {
		this.gamepads.push(e.gamepad);
		this.gamepadTimestamps[e.gamepad.index] = 0;
	};

	private handleGamepadDisconnected = (e: GamepadEvent) => {
		this.gamepads.splice(this.gamepads.indexOf(e.gamepad), 1);
	};
}

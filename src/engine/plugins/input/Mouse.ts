/* eslint-disable no-mixed-spaces-and-tabs */

import InputDevice, { PressedState } from './InputDevice';
import InputManager from './InputManager';
import { Control, MouseButton, MouseScroll } from './Control';

export default class Mouse extends InputDevice {
	protected get listeners() {
		return {
			mousewheel: function (e) {
				this.handleMouseWheel(e);
			}.bind(this),
			DOMMouseScroll: function (e) {
				this.handleMouseWheel(e);
			}.bind(this),
			mousemove: function (e) {
				this.handleMouseMove(e);
			}.bind(this),
			mousedown: function (e) {
				this.handleMouseDown(e);
			}.bind(this),
			mouseup: function (e) {
				this.handleMouseUp(e);
			}.bind(this)
		};
	}

	private lastPosition = { x: 0, y: 0 };
	private position = { x: 0, y: 0 };

	static startPointerLock() {
		if (Mouse.pointerLocked) return;
		document.body.requestPointerLock();
	}

	static stopPointerLock() {
		document.exitPointerLock();
	}

	static get pointerLocked() {
		return document.pointerLockElement === document.body;
	}

	static button(btn: MouseButton | MouseScroll): Control {
		return (input: InputManager) => {
			return {
				down: input.mouse.isDown(btn),
				once: input.mouse.isDownOnce(btn)
			};
		};
	}

	static move(): Control {
		return (input: InputManager) => {
			return {
				down: Boolean(input.mouse.position.x != 0 || input.mouse.position.y != 0),
				once: Boolean(input.mouse.position.x != 0 || input.mouse.position.y != 0),
				x: input.mouse.position.x,
				y: input.mouse.position.y
			};
		};
	}

	destroy() {
		super.destroy();
		if (Mouse.pointerLocked) document.exitPointerLock();
	}

	private handleMouseWheel(event: any) {
		event = window.event || event;
		const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));

		if (delta < 0) {
			this.pressed.set(MouseScroll.Down, this.pressed.has(MouseScroll.Down) ? null : PressedState.Down);
		} else {
			this.pressed.set(MouseScroll.Up, this.pressed.has(MouseScroll.Up) ? null : PressedState.Up);
		}
	}

	private handleMouseMove(event: MouseEvent) {
		const mouse = Mouse.pointerLocked
			? {
					x: event.movementX / 500,
					y: -event.movementY / 500
			  }
			: {
					x: (event.clientX / window.innerWidth) * 2 - 1,
					y: -(event.clientY / window.innerHeight) * 2 + 1
			  };

		const delta = Mouse.pointerLocked
			? {
					x: mouse.x,
					y: mouse.y
			  }
			: {
					x: mouse.x - this.lastPosition.x,
					y: mouse.y - this.lastPosition.y
			  };

		this.position = delta;
		this.lastPosition = mouse;
	}

	private handleMouseDown({ button }: MouseEvent) {
		this.pressed.set(button, this.pressed.has(button) ? null : PressedState.Down);
		return false;
	}

	private handleMouseUp({ button }: MouseEvent) {
		this.pressed.set(button, PressedState.Up);
		return false;
	}
}

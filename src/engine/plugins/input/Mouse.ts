/* eslint-disable no-mixed-spaces-and-tabs */

import InputDevice, { PressedState } from './InputDevice';
import InputManager from './InputManager';
import { Control, MouseButton, MouseScroll } from './Control';

const DeviceSensitivity = 1;

export default class Mouse extends InputDevice {
	protected get listeners() {
		return {
			mousewheel: function (e) {
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

	private lastEventPosition = { x: 0, y: 0 };
	private eventPosition = { x: 0, y: 0 };
	private position = { x: 0, y: 0 };

	static moveWithoutLock = true;

	static startPointerLock() {
		if (Mouse.pointerLocked || InputManager.isTouchCapable) return;
		document.body.requestPointerLock();
	}

	static stopPointerLock() {
		document.exitPointerLock();
	}

	static get pointerLocked() {
		return InputManager.isTouchCapable || document.pointerLockElement === document.body;
	}

	static button(btn: MouseButton | MouseScroll): Control {
		return (input: InputManager) => {
			return {
				down: input.mouse.isDown(btn),
				once: input.mouse.isDownOnce(btn),
				up: input.mouse.isUpOnce(btn)
			};
		};
	}

	static move(sensitivityX = 1, sensitivityY = 1): Control {
		return (input: InputManager) => {
			return {
				down: Boolean(input.mouse.position.x != 0 || input.mouse.position.y != 0),
				once: Boolean(input.mouse.position.x != 0 || input.mouse.position.y != 0),
				up: Boolean(input.mouse.position.x != 0 || input.mouse.position.y != 0),
				x: input.mouse.position.x * DeviceSensitivity * sensitivityX,
				y: input.mouse.position.y * DeviceSensitivity * sensitivityY
			};
		};
	}

	destroy() {
		super.destroy();
		if (Mouse.pointerLocked) document.exitPointerLock();
	}

	public update(deltaTime: number) {
		this.position = this.eventPosition;
		this.eventPosition = { x: 0, y: 0 };
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		for (const btn of Array.from(this.pressed.keys())) {
			// Reset scroll wheel
			if (btn == MouseScroll.Up || btn == MouseScroll.Down) {
				if (this.isDownOnce(btn)) this.pressed.set(btn, null); // Set as down
				if (this.isDown(btn)) this.pressed.set(btn, PressedState.Up); // Show as down for one tick, then trigger keyup
			}
		}
	}

	private handleMouseWheel(event: any) {
		event = window.event || event;
		const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));

		if (delta < 0) {
			this.pressed.set(MouseScroll.Down, this.pressed.has(MouseScroll.Down) ? null : PressedState.Down);
		} else {
			this.pressed.set(MouseScroll.Up, this.pressed.has(MouseScroll.Up) ? null : PressedState.Down);
		}
	}

	private handleMouseMove(event: MouseEvent) {
		const mouse = Mouse.pointerLocked
			? {
					x: event.movementX / 500,
					y: -event.movementY / 500
			  }
			: {
					x: Mouse.moveWithoutLock ? (event.clientX / window.innerWidth) * 5 - 1 : 0,
					y: Mouse.moveWithoutLock ? -(event.clientY / window.innerHeight) * 5 + 1 : 0
			  };

		const delta = Mouse.pointerLocked
			? {
					x: mouse.x,
					y: mouse.y
			  }
			: {
					x: Mouse.moveWithoutLock ? mouse.x - this.lastEventPosition.x : 0,
					y: Mouse.moveWithoutLock ? mouse.y - this.lastEventPosition.y : 0
			  };

		this.eventPosition.x += delta.x;
		this.eventPosition.y += delta.y;
		this.lastEventPosition = mouse;
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

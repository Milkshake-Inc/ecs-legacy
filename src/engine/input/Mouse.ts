/* eslint-disable no-mixed-spaces-and-tabs */

import InputDevice, { PressedState } from './InputDevice';
import InputManager from './InputManager';
import { Control, MouseButton, MouseScroll } from './Control';

export default class Mouse extends InputDevice {
	protected get listeners() {
		return {
			mousewheel: function (e) {
				this.mouseWheelHandler(e);
			}.bind(this),
			DOMMouseScroll: function (e) {
				this.mouseWheelHandler(e);
			}.bind(this),
			mousemove: function (e) {
				this.mouseMoveHandler(e);
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
		return (input: InputManager, playerIndex: number) => {
			return {
				down: input.mouses[0].isDown(btn),
				once: input.mouses[0].isDownOnce(btn)
			};
		};
	}

	static move(): Control {
		return (input: InputManager, playerIndex: number) => {
			const mouse = input.mouses[0];

			return {
				down: Boolean(mouse.position.x != 0 || mouse.position.y != 0),
				once: Boolean(mouse.position.x != 0 || mouse.position.y != 0),
				x: mouse.position.x,
				y: mouse.position.y
			};
		};
	}

	destroy() {
		super.destroy();
		if (Mouse.pointerLocked) document.exitPointerLock();
	}

	mouseWheelHandler(event: any) {
		event = window.event || event;
		const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));

		if (delta < 0) {
			this.pressed.set(MouseScroll.Down, this.pressed.has(MouseScroll.Down) ? null : PressedState.Down);
		} else {
			this.pressed.set(MouseScroll.Up, this.pressed.has(MouseScroll.Up) ? null : PressedState.Up);
		}
	}

	mouseMoveHandler(event: MouseEvent) {
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

	public update(deltaTime: number) {
		super.update(deltaTime);
	}
}

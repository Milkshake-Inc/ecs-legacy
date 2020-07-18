/* eslint-disable no-mixed-spaces-and-tabs */

export type MouseHandlers = {
	click?: () => void;
	move?: (deltaX: number, deltaY: number) => void;
	zoomOut?: (delta: number) => void;
	zoomIn?: (delta: number) => void;
};

export default class Mouse {
	public handlers: MouseHandlers;

	private pointerLock: boolean;
	private domObject: HTMLElement;

	private lastPosition = { x: 0, y: 0 };

	constructor(handlers: MouseHandlers = {}, pointerLock = false, target = document.body) {
		this.handlers = handlers;
		this.pointerLock = pointerLock;
		this.domObject = target;

		this.domObject.addEventListener('click', this.clickHandler.bind(this));
		this.domObject.addEventListener('mousewheel', this.mouseWheelHandler.bind(this));
		this.domObject.addEventListener('DOMMouseScroll', this.mouseWheelHandler.bind(this));
		this.domObject.addEventListener('mousemove', this.mouseMoveHandler.bind(this));
	}

	get pointerLocked() {
		return document.pointerLockElement === this.domObject;
	}

	destroy() {
		this.domObject.removeEventListener('mousewheel', this.mouseWheelHandler.bind(this));
		this.domObject.addEventListener('DOMMouseScroll', this.mouseWheelHandler.bind(this));
		this.domObject.addEventListener('mousemove', this.mouseMoveHandler.bind(this));

		if (this.pointerLock) document.exitPointerLock();
	}

	mouseWheelHandler(event: any) {
		event = window.event || event;
		const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));

		if (delta < 0 && this.handlers.zoomOut) {
			this.handlers.zoomOut(delta);
		} else if (this.handlers.zoomIn) {
			this.handlers.zoomIn(delta);
		}
	}

	clickHandler(event: MouseEvent) {
		if (this.pointerLock) document.body.requestPointerLock();
		if (this.handlers.click) this.handlers.click();
	}

	mouseMoveHandler(event: MouseEvent) {
		const mouse = this.pointerLocked
			? {
					x: event.movementX / 500,
					y: -event.movementY / 500
			  }
			: {
					x: (event.clientX / window.innerWidth) * 2 - 1,
					y: -(event.clientY / window.innerHeight) * 2 + 1
			  };

		const delta = this.pointerLocked
			? {
					x: mouse.x,
					y: mouse.y
			  }
			: {
					x: mouse.x - this.lastPosition.x,
					y: mouse.y - this.lastPosition.y
			  };

		if (this.handlers.move) this.handlers.move(delta.x, delta.y);
		this.lastPosition = mouse;
	}
}

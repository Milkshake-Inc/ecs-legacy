/* eslint-disable no-mixed-spaces-and-tabs */
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from './ThirdPersonTarget';
import { Engine } from '@ecs/ecs/Engine';
import Mouse from '@ecs/input/Mouse';
import MathHelper from '@ecs/math/MathHelper';
import { InputBindings, GamepadAxis, MouseAxis, Keys, GamepadButtons, MouseButtons } from '@ecs/input2/types';
import { Input } from '@ecs/input2/Input';

enum TouchActions {
	Touch = 'Touch'
}

// https://github.com/CharlotteGore/Hassle-Input
const bindings: InputBindings<any, any, TouchActions> = {
	gamepad: {
		axis: {},
		buttons: {},
		enabled: {}
	},
	keys: {
		axis: null,
		buttons: {},
		enabled: {}
	},
	mouse: {
		axis: {},
		buttons: {},
		enabled: {}
	},
	touch: {
		touches: TouchActions.Touch
	}
};

export default class ThirdPersonCameraSystem extends System {
	private mouse: Mouse;
	private input: Input<any, any, TouchActions>;
	private cameraAngle: Vector3 = new Vector3(0.76, 0.3);
	private lastPos: Vector3 = new Vector3(0.76, 0.3);
	private startTouch: Vector3;

	private zoom = {
		value: 1,
		min: 0.1,
		max: 5,
		speed: 0.1
	};

	private queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera),
		target: all(Transform, ThirdPersonTarget)
	});

	onAddedToEngine(engine: Engine) {
		this.input = new Input<any, any, TouchActions>();
		this.input.bindActions(bindings);
		this.input.setMouseAndTouchActiveElement(document.querySelector('canvas').parentElement);
		this.input.initialize();

		// Enable mouse input if touch not available...
		if (!this.input.getActionStatus().touch.Touch) {
			// TODO port mouse to input
			this.mouse = new Mouse(
				{
					move: this.move.bind(this),
					zoomIn: this.zoomIn.bind(this),
					zoomOut: this.zoomOut.bind(this)
				},
				true
			);
		}
	}

	onRemovedFromEngine(engine: Engine) {
		if (this.mouse) this.mouse.destroy();
		this.input.destroy();
	}

	get target() {
		return this.queries.target.first?.get(Transform);
	}

	get camera() {
		return this.queries.camera.first?.get(Transform);
	}

	get acamera() {
		return this.queries.camera.first?.get(PerspectiveCamera);
	}

	zoomIn() {
		this.zoom.value = MathHelper.clamp((this.zoom.value -= this.zoom.speed), this.zoom.min, this.zoom.max);
	}

	zoomOut() {
		this.zoom.value = MathHelper.clamp((this.zoom.value += this.zoom.speed), this.zoom.min, this.zoom.max);
	}

	move(deltaX: number, deltaY: number) {
		this.cameraAngle.x -= deltaX;
		this.cameraAngle.y -= deltaY;
		this.cameraAngle.y = MathHelper.clamp(this.cameraAngle.y, 0.01, Math.PI);
	}

	// TODO Massively needs simplifying...
	processTouchInput() {
		this.input.update();
		const inputStatus = this.input.getActionStatus();
		const activeTouches = Object.values(inputStatus.touch.Touch || []).filter(t => t.active);

		if (activeTouches[0]) {
			if (!this.startTouch) {
				this.startTouch = new Vector3(activeTouches[0].x, activeTouches[0].y);
			}
			const pos = new Vector3(activeTouches[0].x, activeTouches[0].y);
			const delta = this.startTouch.clone().sub(pos);

			this.cameraAngle.x = this.lastPos.x + delta.x;
			this.cameraAngle.y = this.lastPos.y + delta.y;
		} else if (this.startTouch) {
			this.startTouch = null;
			this.lastPos = this.cameraAngle.clone();
		}
	}

	public updateLate(dt: number) {
		super.updateLate(dt);

		this.processTouchInput();

		if (!this.target || this.target.position.x == undefined || !this.acamera) {
			return;
		}

		// NEED TO FIGURE OUT THIS MATH....
		const xAngle = this.cameraAngle.x;
		const angleY = this.cameraAngle.y;
		const angleX = Math.cos(-xAngle);
		const angleZ = Math.sin(-xAngle);

		this.camera.x = this.target.position.x + angleX;
		this.camera.y = this.target.position.y + angleY;
		this.camera.z = this.target.position.z + angleZ;

		// Set Zoom
		this.camera.position = this.camera.position.sub(this.target.position).multiF(this.zoom.value).add(this.target.position);

		// Update Camera
		this.acamera.position.set(this.camera.x, this.camera.y, this.camera.z);
		this.acamera.lookAt(this.target.position.x, this.target.position.y, this.target.position.z);
	}
}

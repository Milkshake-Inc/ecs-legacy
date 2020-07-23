/* eslint-disable no-mixed-spaces-and-tabs */
import { useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/plugins/math/Vector';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/ecs/Query';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from './ThirdPersonTarget';
import Mouse from '@ecs/plugins/input/Mouse';
import Gamepad from '@ecs/plugins/input/Gamepad';
import Touch from '@ecs/plugins/input/Touch';
import MathHelper from '@ecs/plugins/math/MathHelper';
import Input from '@ecs/plugins/input/components/Input';
import { MouseScroll, Controls, Stick, Gesture } from '@ecs/plugins/input/Control';

const CameraInput = {
	zoomIn: Controls.or(Mouse.button(MouseScroll.Up), Touch.gesture(Gesture.PinchOut)),
	zoomOut: Controls.or(Mouse.button(MouseScroll.Down), Touch.gesture(Gesture.PinchIn)),
	move: Controls.or(
		Gamepad.stick(Stick.Left, 0, -1),
		Gamepad.stick(Stick.Right, 0, -1),
		Gamepad.stick(Stick.Left, 1, -1),
		Gamepad.stick(Stick.Right, 1, -1),
		Mouse.move(),
		Touch.gesture(Gesture.Pan)
	)
};

export default class ThirdPersonCameraSystem extends System {
	private cameraAngle: Vector3 = new Vector3(0.76, 0.3);

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

	private inputs = useState(this, new Input(CameraInput));

	get target() {
		return this.queries.target.first?.get(Transform);
	}

	get camera() {
		return this.queries.camera.first?.get(Transform);
	}

	get acamera() {
		return this.queries.camera.first?.get(PerspectiveCamera);
	}

	public updateLate(dt: number) {
		super.updateLate(dt);

		if (!this.target || this.target.position.x == undefined || !this.acamera) {
			return;
		}

		if (this.inputs.state.zoomIn.down) {
			this.zoom.value = MathHelper.clamp((this.zoom.value -= this.zoom.speed), this.zoom.min, this.zoom.max);
		}

		if (this.inputs.state.zoomOut.down) {
			this.zoom.value = MathHelper.clamp((this.zoom.value += this.zoom.speed), this.zoom.min, this.zoom.max);
		}

		if (this.inputs.state.move.down) {
			this.cameraAngle.x += this.inputs.state.move.x;
			this.cameraAngle.y -= this.inputs.state.move.y;
			this.cameraAngle.y = MathHelper.clamp(this.cameraAngle.y, 0.01, Math.PI);
		}

		// NEED TO FIGURE OUT THIS MATH....
		const xAngle = -this.cameraAngle.x;
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

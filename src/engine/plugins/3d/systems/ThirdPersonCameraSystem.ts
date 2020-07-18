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

export default class ThirdPersonCameraSystem extends System {
	private mouse: Mouse;
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

	onAddedToEngine(engine: Engine) {
		this.mouse = new Mouse(
			{
				move: this.move.bind(this),
				zoomIn: this.zoomIn.bind(this),
				zoomOut: this.zoomOut.bind(this)
			},
			true
		);
	}

	onRemovedFromEngine(engine: Engine) {
		this.mouse.destroy();
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
		this.cameraAngle.x += deltaX;
		this.cameraAngle.y -= deltaY;
		this.cameraAngle.y = MathHelper.clamp(this.cameraAngle.y, 0.01, Math.PI);
	}

	public updateLate(dt: number) {
		super.updateLate(dt);

		if (!this.target || this.target.position.x == undefined || !this.acamera) {
			return;
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

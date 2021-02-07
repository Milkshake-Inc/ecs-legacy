/* eslint-disable no-mixed-spaces-and-tabs */
import { useQueries } from '@ecs/core/helpers';
import { System, all } from 'tick-knock';
import Vector3 from '@ecs/plugins/math/Vector';
import Transform from '@ecs/plugins/math/Transform';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from './ThirdPersonTarget';
import MathHelper from '@ecs/plugins/math/MathHelper';
import { ToQuaternion } from '@ecs/plugins/tools/Conversions';

export default class ThirdPersonCameraPanSystem extends System {
	private cameraAngle: Vector3 = new Vector3(0.76, 0.3);

	private zoom = {
		value: 10,
		min: 0.1,
		max: 5,
		speed: 0.1
	};

	private queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera),
		target: all(Transform, ThirdPersonTarget)
	});

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

		this.zoom.value = 50;

		this.cameraAngle.x -= 0.001;
		this.cameraAngle.y = 0.5;

		// NEED TO FIGURE OUT THIS MATH....
		const xAngle = -this.cameraAngle.x;
		const angleY = this.cameraAngle.y;
		const angleX = Math.cos(-xAngle);
		const angleZ = Math.sin(-xAngle);

		this.camera.x = this.target.position.x + angleX;
		this.camera.y = this.target.position.y + angleY;
		this.camera.z = this.target.position.z + angleZ;

		// Set Zoom
		this.camera.position.sub(this.target.position).multi(this.zoom.value).add(this.target.position);

		// Update Camera
		this.acamera.position.set(this.camera.x, this.camera.y, this.camera.z);
		// TODO Port lookat to ecs maths (requires matrix4)
		this.acamera.lookAt(this.target.position.x, this.target.position.y, this.target.position.z);

		// Update camera quaternion
		this.camera.quaternion = ToQuaternion(this.acamera.quaternion);
	}
}

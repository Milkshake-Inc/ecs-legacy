import { Body, Quaternion, Vec3 } from 'cannon';
import Vector3 from '@ecs/math/Vector';
import MathHelper from '@ecs/math/MathHelper';

export default class CannonBody extends Body {
	rotate(euler: Vector3 | Vec3) {
		this.quaternion.mult(new Quaternion().setFromEuler(euler.x, euler.y, euler.z), this.quaternion);
	}

	look(direction: Vector3 | Vec3 = Vector3.FORWARD) {
		return this.quaternion.vmult(CannonBody.ToVec3(direction));
	}

	// Still a bit buggy
	// https://stackoverflow.com/questions/12435671/quaternion-lookat-function
	// https://gamedev.stackexchange.com/questions/15070/orienting-a-model-to-face-a-target
	lookAt(body: CannonBody, up: Vector3 | Vec3 = Vector3.FORWARD) {
		const direction = body.position.vsub(this.position);
		direction.normalize();
		const dot = CannonBody.ToVec3(Vector3.FORWARD).dot(direction);

		if (Math.abs(dot - -1) < 0.000001) {
			this.quaternion.set(up.x, up.y, up.z, MathHelper.toRadians(180.0));
			return;
		}

		if (Math.abs(dot - 1) < 0.000001) {
			this.quaternion = new Quaternion();
			return;
		}

		const rotAngle = Math.acos(dot);

		const axis = CannonBody.ToVec3(up).cross(direction);
		axis.normalize();

		this.quaternion.setFromAxisAngle(axis, rotAngle);
		// this.quaternion.inverse(this.quaternion);
	}

	get forward() {
		return this.look(Vector3.FORWARD);
	}

	get back() {
		return this.look(Vector3.BACKWARD);
	}

	get left() {
		return this.look(Vector3.LEFT);
	}

	get right() {
		return this.look(Vector3.RIGHT);
	}

	get up() {
		return this.look(Vector3.UP);
	}

	get down() {
		return this.look(Vector3.DOWN);
	}

	static ToVec3(value: Vec3 | Vector3) {
		if (value instanceof Vec3) return value;
		return new Vec3(value.x, value.y, value.z);
	}

	static ToVector3(value: Vec3 | Vector3) {
		if (value instanceof Vector3) return value;
		return new Vector3(value.x, value.y, value.z);
	}
}

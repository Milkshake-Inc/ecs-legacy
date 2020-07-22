import Vector3, { Vector } from './Vector';

export default class Quaternion {
	public static Identity() {
		return new Quaternion(0, 0, 0, 1);
	}

	public static From(value: { x: number; y: number; z: number; w: number }) {
		return new Quaternion(value.x, value.y, value.z, value.w);
	}

	public static To(value: Quaternion) {
		return { x: value.x, y: value.y, z: value.z, w: value.w };
	}

	public x: number;
	public y: number;
	public z: number;
	public w: number;

	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	set(x: number, y: number, z: number, w: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;
	}

	clone() {
		return new Quaternion(this.x, this.y, this.z, this.w);
	}

	setFromEuler({ x, y, z }: Vector) {
		const c1 = Math.cos(x / 2);
		const c2 = Math.cos(y / 2);
		const c3 = Math.cos(z / 2);

		const s1 = Math.sin(x / 2);
		const s2 = Math.sin(y / 2);
		const s3 = Math.sin(z / 2);

		this.x = s1 * c2 * c3 + c1 * s2 * s3;
		this.y = c1 * s2 * c3 - s1 * c2 * s3;
		this.z = c1 * c2 * s3 + s1 * s2 * c3;
		this.w = c1 * c2 * c3 - s1 * s2 * s3;

		return this;
	}

	toEuler(order = 'YZX') {
		let heading, attitude, bank;
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const w = this.w;

		const test = x * y + z * w;
		if (test > 0.499) {
			// singularity at north pole
			heading = 2 * Math.atan2(x, w);
			attitude = Math.PI / 2;
			bank = 0;
		}
		if (test < -0.499) {
			// singularity at south pole
			heading = -2 * Math.atan2(x, w);
			attitude = -Math.PI / 2;
			bank = 0;
		}
		if (isNaN(heading)) {
			const sqx = x * x;
			const sqy = y * y;
			const sqz = z * z;
			heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
			attitude = Math.asin(2 * test); // attitude
			bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
		}

		return new Vector3(bank, heading, attitude);
	}

	multiV({ x, y, z }: Vector3) {
		const qx = this.x,
			qy = this.y,
			qz = this.z,
			qw = this.w;

		const ix = qw * x + qy * z - qz * y,
			iy = qw * y + qz * x - qx * z,
			iz = qw * z + qx * y - qy * x,
			iw = -qx * x - qy * y - qz * z;

		return new Vector3(
			ix * qw + iw * -qx + iy * -qz - iz * -qy,
			iy * qw + iw * -qy + iz * -qx - ix * -qz,
			iz * qw + iw * -qz + ix * -qy - iy * -qx
		);
	}

	multiply(value: Quaternion | { x: number; y: number; z: number; w: number }) {
		const qax = this.x,
			qay = this.y,
			qaz = this.z,
			qaw = this.w;
		const qbx = value.x,
			qby = value.y,
			qbz = value.z,
			qbw = value.w;

		this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		return this;
	}

	setFromAxisAngle(axis: Vector3, angle: number) {
		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		const halfAngle = angle / 2,
			s = Math.sin(halfAngle);

		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = Math.cos(halfAngle);

		return this;
	}

	multiplyFromAxisAngle(axis: Vector3, angle: number) {
		// assumes axis is normalized
		const halfAngle = angle / 2,
			s = Math.sin(halfAngle);

		return this.multiply({
			x: axis.x * s,
			y: axis.y * s,
			z: axis.z * s,
			w: Math.cos(halfAngle)
		});
	}

	normalize() {
		const num = 1 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
		this.x *= num;
		this.y *= num;
		this.z *= num;
		this.w *= num;
	}

	slerp(target: Quaternion, t: number) {
		if (t === 0) return this;
		if (t === 1) return target.clone();

		const x = this.x,
			y = this.y,
			z = this.z,
			w = this.w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		let cosHalfTheta = w * target.w + x * target.x + y * target.y + z * target.z;

		if (cosHalfTheta < 0) {
			this.w = -target.w;
			this.x = -target.x;
			this.y = -target.y;
			this.z = -target.z;

			cosHalfTheta = -cosHalfTheta;
		} else {
			this.set(target.x, target.y, target.z, target.w);
		}

		if (cosHalfTheta >= 1.0) {
			this.w = w;
			this.x = x;
			this.y = y;
			this.z = z;

			return this;
		}

		const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

		if (sqrSinHalfTheta <= Number.EPSILON) {
			const s = 1 - t;
			this.w = s * w + t * this.w;
			this.x = s * x + t * this.x;
			this.y = s * y + t * this.y;
			this.z = s * z + t * this.z;

			this.normalize();

			return this;
		}

		const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
		const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
		const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
			ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

		this.w = w * ratioA + this.w * ratioB;
		this.x = x * ratioA + this.x * ratioB;
		this.y = y * ratioA + this.y * ratioB;
		this.z = z * ratioA + this.z * ratioB;

		return this;
	}
}

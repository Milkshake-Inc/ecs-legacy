import Vector3 from './Vector';
import MathHelper from './MathHelper';

export default class Quaternion {

	public static Identity() {
		return new Quaternion(0, 0, 0, 1);
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

	setFromEuler({ x, y, z }: Vector3) {
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
		const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
		const qbx = value.x, qby = value.y, qbz = value.z, qbw = value.w;

		this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		return this;
	}

	setFromAxisAngle(axis: Vector3, angle: number) {
		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = Math.cos( halfAngle );

		return this;
	}

	multiplyFromAxisAngle(axis: Vector3, angle: number) {
		// assumes axis is normalized
		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		return this.multiply({
			x: axis.x * s,
			y:axis.y * s,
			z:axis.z * s,
			w: Math.cos( halfAngle )
		});
	}

	normalize()
	{
		const num = 1 / Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
		this.x *= num;
		this.y *= num;
		this.z *= num;
		this.w *= num;
	}
}

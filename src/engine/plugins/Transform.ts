import Vector3 from '@ecs/math/Vector';
import Quaternion from '@ecs/math/Quaternion';

export default class Transform {
	constructor(
		public position: Vector3 = new Vector3(),
		public rotation: Vector3 = new Vector3(),
		public quaternion: Quaternion = new Quaternion(),
		public scale: Vector3 = Vector3.ONE
	) {}

	public get x(): number {
		return this.position.x;
	}

	public set x(value: number) {
		this.position.x = value;
	}

	public get y(): number {
		return this.position.y;
	}

	public set y(value: number) {
		this.position.y = value;
	}

	public get z(): number {
		return this.position.z;
	}

	public set z(value: number) {
		this.position.z = value;
	}

	public get rx(): number {
		return this.rotation.x;
	}

	public set rx(value: number) {
		this.rotation.x = value;
	}

	public get ry(): number {
		return this.rotation.x;
	}

	public set ry(value: number) {
		this.rotation.y = value;
	}

	public get rz(): number {
		return this.rotation.z;
	}

	public set rz(value: number) {
		this.rotation.z = value;
	}

	public get qx(): number {
		return this.quaternion.x;
	}

	public set qx(value: number) {
		this.quaternion.x = value;
	}

	public get qy(): number {
		return this.quaternion.y;
	}

	public set qy(value: number) {
		this.quaternion.y = value;
	}

	public get qz(): number {
		return this.quaternion.z;
	}

	public set qz(value: number) {
		this.quaternion.z = value;
	}

	public get qw(): number {
		return this.quaternion.w;
	}

	public set qw(value: number) {
		this.quaternion.w = value;
	}

	public get sx(): number {
		return this.scale.x;
	}

	public set sx(value: number) {
		this.scale.x = value;
	}

	public get sy(): number {
		return this.scale.y;
	}

	public set sy(value: number) {
		this.scale.y = value;
	}

	public get sz(): number {
		return this.scale.z;
	}

	public set sz(value: number) {
		this.scale.z = value;
	}

	public clone(): Transform {
		return JSON.parse(JSON.stringify(this));
	}

	public updateRotationFromQuaternion() {
		this.rotation.setFromQuaternion(this.quaternion);
	}

	public updateQuaternionFromRotation() {
		this.quaternion.setFromEuler(this.rotation);
	}

	public look(direction = Vector3.FORWARD) {
		return this.quaternion.multiV(direction);
	}
}

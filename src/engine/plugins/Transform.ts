import Vector3 from '@ecs/math/Vector';
import Quaternion from '@ecs/math/Quaternion';

export default class Transform {
	constructor(
		public position: Vector3 = new Vector3(),
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

	// If you do transform.rotation.x/y/z it won't actaully update
	public get rotation(): Vector3 {
		return this.quaternion.toEuler();
	}

	public set rotation(value: Vector3) {
		this.quaternion.setFromEuler(value);
	}

	public get rx(): number {
		return this.quaternion.toEuler().x;
	}

	public set rx(value: number) {
		const euler = this.quaternion.toEuler();
		euler.x = value;
		this.quaternion.setFromEuler(euler);
	}

	public get ry(): number {
		return this.quaternion.toEuler().y;
	}

	public set ry(value: number) {
		const euler = this.quaternion.toEuler();
		euler.y = value;
		this.quaternion.setFromEuler(euler);
	}

	public get rz(): number {
		return this.quaternion.toEuler().z;
	}

	public set rz(value: number) {
		const euler = this.quaternion.toEuler();
		euler.z = value;
		this.quaternion.setFromEuler(euler);
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
		return new Transform(this.position.clone(), this.quaternion.clone(), this.scale.clone())
	}

	public look(direction = Vector3.FORWARD) {
		return this.quaternion.multiV(direction);
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

	static To(value: Transform) {
		return {
			position: Vector3.To(value.position),
			quaternion: Quaternion.To(value.quaternion),
			scale: Vector3.To(value.scale),
		}
	}

	static From(value: ReturnType<typeof Transform.To>) {
		return new Transform(
			Vector3.From(value.position),
			Quaternion.From(value.quaternion),
			Vector3.From(value.scale)
		)
	}
}

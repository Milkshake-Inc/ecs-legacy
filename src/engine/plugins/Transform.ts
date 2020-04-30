import Vector3 from '@ecs/math/Vector';

export default class Transform {
	constructor(public position: Vector3 = Vector3.ZERO, public rotation: Vector3 = Vector3.ZERO, public scale: Vector3 = Vector3.ONE) {}

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
		return Object.assign({}, this);
	}
}

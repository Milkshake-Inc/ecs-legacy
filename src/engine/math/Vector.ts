import Quaternion from './Quaternion';

export type Vector = { x: number; y: number; z: number };

// Refs
// https://github.com/ManojLakshan/monogame/blob/master/MonoGame.Framework/Vector3.cs
// https://github.com/photonstorm/phaser/blob/v2.4.4/src/geom/Point.js
export default class Vector3 {
	public static get ZERO(): Vector3 {
		return Vector3.EQUAL(0);
	}
	public static get ONE(): Vector3 {
		return Vector3.EQUAL(1);
	}
	public static get HALF(): Vector3 {
		return Vector3.EQUAL(0.5);
	}

	public static get UP(): Vector3 {
		return new Vector3(0, 1, 0);
	}

	public static get DOWN(): Vector3 {
		return new Vector3(0, -1, 0);
	}

	public static get LEFT(): Vector3 {
		return new Vector3(-1, 0, 0);
	}

	public static get RIGHT(): Vector3 {
		return new Vector3(1, 0, 0);
	}

	public static get FORWARD(): Vector3 {
		return new Vector3(0, 0, -1);
	}

	public static get BACKWARD(): Vector3 {
		return new Vector3(0, 0, 1);
	}

	public static EQUAL(value: number): Vector3 {
		return new Vector3(value, value, value);
	}

	public static COPY(value: Vector3 | Vector): Vector3 {
		return new Vector3(value.x, value.y);
	}

	public x: number;
	public y: number;
	public z: number;

	constructor(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	set(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	setFromQuaternion({ x, y, z, w }: Quaternion) {
		this.x = Math.atan2(2 * (x * y + z * w), 1 - 2 * (y * y + z * z));
		this.y = Math.asin(2 * (x * z - w * y));
		this.z = Math.atan2(2 * (x * w + y * z), 1 - 2 * (z * z + w * w));

		return this;
	}

	add(value: Vector3 | Vector) {
		return new Vector3(this.x + value.x, this.y + value.y, this.z + value.z);
	}

	addF(value: number) {
		return new Vector3(this.x + value, this.y + value, this.z + value);
	}

	sub(value: Vector3 | Vector) {
		return new Vector3(this.x - value.x, this.y - value.y, this.z - value.z);
	}

	subF(value: number) {
		return new Vector3(this.x - value, this.y - value, this.z - value);
	}

	multi(value: Vector3 | Vector) {
		return new Vector3(this.x * value.x, this.y * value.y, this.z * value.z);
	}

	multiF(value: number) {
		return new Vector3(this.x * value, this.y * value, this.z * value);
	}

	dev(value: Vector3 | Vector) {
		return new Vector3(this.x / value.x, this.y / value.y, this.z / value.z);
	}

	devf(value: number) {
		return new Vector3(this.x / value, this.y / value, this.z / value);
	}

	distance(value: Vector3 | Vector): number {
		return Math.sqrt(Math.pow(this.x - value.x, 2) + Math.pow(this.y - value.y, 2) + Math.pow(this.z - value.z, 2));
	}

	equals(value: Vector3 | Vector): boolean {
		return this.x == value.x && this.y == value.y && this.z == value.z;
	}

	clone(): Vector3 {
		return new Vector3(this.x, this.y, this.z);
	}

	toString(): string {
		return `x: ${this.x}, y: ${this.y}, z: ${this.y}`;
	}

	toBoolean(): boolean {
		return !this.equals(Vector3.ZERO);
	}

	magnitude(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y * this.z + this.z);
	}
}

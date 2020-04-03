// Refs
// https://github.com/ManojLakshan/monogame/blob/master/MonoGame.Framework/Vector2.cs
// https://github.com/photonstorm/phaser/blob/v2.4.4/src/geom/Point.js
export default class Vector2 {
	public static get ZERO(): Vector2 {
		return new Vector2(0, 0);
	}
	public static get ONE(): Vector2 {
		return new Vector2(1, 1);
	}
	public static get HALF(): Vector2 {
		return new Vector2(0.5, 0.5);
	}

	public static EQUAL(value: number): Vector2 {
		return new Vector2(value, value);
	}

	public static COPY(value: Vector2): Vector2 {
		return new Vector2(value.x, value.y);
	}

	public x: number;
	public y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	set(x: number, y: number) {
		this.x = x;
		this.y = y;

		return this;
	}

	add(value: Vector2 | { x: number; y: number }) {
		return new Vector2(this.x + value.x, this.y + value.y);
	}

	sub(value: Vector2) {
		return new Vector2(this.x - value.x, this.y - value.y);
	}

	multi(value: Vector2) {
		return new Vector2(this.x * value.x, this.y * value.y);
	}

	multiF(value: number) {
		return new Vector2(this.x * value, this.y * value);
	}

	dev(value: Vector2) {
		return new Vector2(this.x / value.x, this.y / value.y);
	}

	devf(value: number) {
		return new Vector2(this.x / value, this.y / value);
	}

	distance(value: Vector2): number {
		return Math.sqrt(Math.pow(this.x - value.x, 2) + Math.pow(this.y - value.y, 2));
	}

	angle(value: Vector2 | { x: number; y: number }): number {
		return Math.atan2(this.y - value.y, this.x - value.x);
	}

	equals(value: Vector2): boolean {
		return this.x == value.x && this.y == value.y;
	}

	clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	toString(): string {
		return `x: ${this.x}, y: ${this.y}`;
	}

	toBoolean(): boolean {
		return !this.equals(Vector2.ZERO);
	}

	magnitude(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}

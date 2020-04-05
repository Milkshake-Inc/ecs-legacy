import { Body, Bodies, IBodyDefinition, IChamferableBodyDefinition } from 'matter-js';

type Readonly<T> = {
	readonly [P in keyof T]: T[P];
};

export default class PhysicsBody {
	constructor(public body: Readonly<Body>) {}

	public static circle(radius: number, options?: IBodyDefinition, maxSides?: number): Body {
		return Bodies.circle(0, 0, radius, options, maxSides);
	}

	public static polygon(sides: number, radius: number, options?: IChamferableBodyDefinition): Body {
		return Bodies.polygon(0, 0, sides, radius, options);
	}

	public static rectangle(width: number, height: number, options?: IChamferableBodyDefinition): Body {
		return Bodies.rectangle(0, 0, width, height, options);
	}

	public static trapezoid(width: number, height: number, slope: number, options?: IChamferableBodyDefinition): Body {
		return Bodies.trapezoid(0, 0, width, height, slope, options);
	}

	public static fromVertices(
		vertexSets: Array<Array<{ x: number; y: number }>>,
		options?: IBodyDefinition,
		flagInternal?: boolean,
		removeCollinear?: number,
		minimumArea?: number
	): Body {
		return Bodies.fromVertices(0, 0, vertexSets, options, flagInternal, removeCollinear, minimumArea);
	}

	public applyForce(position: { x: number; y: number }, force: { x: number; y: number }): void {
		Body.applyForce(this.body, position, force);
	}

	public rotate(rotation: number): void {
		Body.rotate(this.body, rotation);
	}

	public scale(scale: { x: number; y: number }, point?: { x: number; y: number }): void {
		Body.scale(this.body, scale.x, scale.y, point);
	}

	public translate(translation: { x: number; y: number }): void {
		Body.translate(this.body, translation);
	}

	public set position(position: { x: number; y: number }) {
		Body.setPosition(this.body, position);
	}

	public set velocity(velocity: { x: number; y: number }) {
		Body.setVelocity(this.body, velocity);
	}

	public set mass(mass: number) {
		Body.setMass(this.body, mass);
	}

	public set density(density: number) {
		Body.setDensity(this.body, density);
	}

	public set inertia(inertia: number) {
		Body.setInertia(this.body, inertia);
	}

	public set vertices(vertices: Array<{ x: number; y: number }>) {
		Body.setVertices(this.body, vertices);
	}

	public set parts(parts: Body[]) {
		Body.setParts(this.body, parts);
	}

	public set center(center: { x: number; y: number }) {
		Body.setCentre(this.body, center);
	}

	public set angle(angle: number) {
		Body.setAngle(this.body, angle);
	}

	public set angularVelocity(velocity: number) {
		Body.setAngularVelocity(this.body, velocity);
	}

	public set static(isStatic: boolean) {
		Body.setStatic(this.body, isStatic);
	}
}

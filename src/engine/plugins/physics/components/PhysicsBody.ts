import { Body } from 'matter-js';

type Readonly<T> = {
	readonly [P in keyof T]: T[P];
};

export class PhysicsBody {
	constructor(public body: Readonly<Body>) {}
}

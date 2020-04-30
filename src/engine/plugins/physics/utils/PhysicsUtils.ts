import decomp from 'poly-decomp';
import { Vec3, Body } from 'cannon';
import Vector3 from '@ecs/math/Vector';

// API: https://brm.io/matter-js/docs/classes/Bodies.html
// Code: https://brm.io/matter-js/docs/files/src_factory_Bodies.js.html#l179
//
// In MatterJs when using `Bodies.fromVertices` it attempts to pull the 'poly-decomp'
// library in from a global window var. This is a work around for this.
//
// Alternativly we could pull the code form 'Bodies.fromVertices' and tweak it to
// use the library as a normal import or not at all.
export const injectPolyDecomp = () => {
	// For NodeJS env
	if (typeof window === 'undefined') {
		(global as any).window = {};
	}

	((<any>window) as any).decomp = decomp;
};

export const ToVec3 = (value: Vector3) => new Vec3(value.x, value.y, value.z);

export const ToVector3 = (value: Vec3) => new Vector3(value.x, value.y, value.z);

export const Look = (body: Body, dir = Vector3.FORWARD) => body.quaternion.vmult(ToVec3(dir));

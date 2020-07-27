import { Material, ContactMaterial, Vec3 } from 'cannon-es';
import { CannonBodyOptions } from '@ecs/plugins/physics/3d/components/CannonBody';

export const BALL_HIT_POWER = 1.25;

// Must be powers of 2
export enum CollisionFilterGroups {
	COURSE = 1,
	BALL = 2,
	OTHER = 4
}

export const COURSE_MATERIAL = new Material('COURSE_MATERIAL');

export const BALL_MATERIAL = new Material('BALL_MATERIAL');

export const FLOOR_BALL_MATERIAL = new ContactMaterial(COURSE_MATERIAL, BALL_MATERIAL, {
	friction: 0.3,
	restitution: 0.8,
	// contactEquationStiffness: 1e10,
	frictionEquationStiffness: 1e2
});

export const BALL_BODY: CannonBodyOptions = {
	mass: 1,
	material: BALL_MATERIAL,
	angularDamping: 0.7,
	linearDamping: 0.5,
	angularFactor: new Vec3(1.5, 1.5, 1.5),
	linearFactor: new Vec3(1, 0.8, 1),
	collisionFilterGroup: CollisionFilterGroups.BALL, // Example: https://github.com/react-spring/cannon-es/blob/master/examples/collisionFilter.html#L40
	collisionFilterMask: CollisionFilterGroups.COURSE
};

export const COURSE_BODY: CannonBodyOptions = {
	material: COURSE_MATERIAL,
	collisionFilterGroup: CollisionFilterGroups.COURSE,
	collisionFilterMask: CollisionFilterGroups.BALL
};

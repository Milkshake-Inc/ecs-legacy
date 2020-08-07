import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import { AmmoInstance } from '@ecs/plugins/physics/ammo/AmmoLoader';

export const BALL_HIT_MULTIPLIER = 0.5;

export const BallBody = () => {
	const body = new AmmoBody(1);
	body.restitution = 0.5;
	body.setDamping(0.3, 0);

	body.ccdMotionThreshold = 0.1;
	body.ccdSweptSphereRadius = 0.06;
	// body.setAngularFactor(new AmmoInstance.btVector3(1, 1, 1));
	// body.setLinearFactor(new AmmoInstance.btVector3(1, 0.9, 1));
	// body.friction = 0.2;
	// body.rollingFriction = 0.2;
	return body;
};

export const TerrainBody = () => {
	const body = new AmmoBody(0);
	body.restitution = 1;
	// body.friction = 0.5;
	// body.rollingFriction = 0.5;
	// body.setDamping(0, 0);
	return body;
};

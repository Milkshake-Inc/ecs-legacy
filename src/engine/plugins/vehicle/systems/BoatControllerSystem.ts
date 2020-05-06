import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Vehicle from '../components/Vehicle';
import Input from '@ecs/plugins/input/components/Input';
import PhysicsState from '@ecs/plugins/physics/components/PhysicsState';
import { useQueries } from '@ecs/ecs/helpers';
import Boat from '../components/Boat';

const Acceleration = 0.02;
const RotateAcceleration = 0.02;

export default class BoatControllerSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		physics: all(PhysicsState)
	});

	constructor() {
		super(makeQuery(all(Vehicle, Boat, CannonBody, Input)));
	}

	// should be pre physics
	updateEntityFixed(entity: Entity, dt: number) {
		const input = entity.get(Input);
		const body = entity.get(CannonBody);

		if (input.downDown) {
			body.velocity.x -= body.forward.x * Acceleration * dt;
			body.velocity.y -= body.forward.y * Acceleration * dt;
			body.velocity.z -= body.forward.z * Acceleration * dt;
		}
		if (input.upDown) {
			body.velocity.x += body.forward.x * Acceleration * dt;
			body.velocity.y += body.forward.y * Acceleration * dt;
			body.velocity.z += body.forward.z * Acceleration * dt;
		}

		if (input.rightDown) {
			body.angularVelocity.x -= body.up.x * RotateAcceleration * dt;
			body.angularVelocity.y -= body.up.y * RotateAcceleration * dt;
			body.angularVelocity.z -= body.up.z * RotateAcceleration * dt;
		}
		if (input.leftDown) {
			body.angularVelocity.x += body.up.x * RotateAcceleration * dt;
			body.angularVelocity.y += body.up.y * RotateAcceleration * dt;
			body.angularVelocity.z += body.up.z * RotateAcceleration * dt;
		}

		// Damping on every axis except y (because gravity yo)
		body.velocity.x *= 0.99;
		body.velocity.z *= 0.99;
		body.angularVelocity = body.angularVelocity.scale(0.9);
	}
}

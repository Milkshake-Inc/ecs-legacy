import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Vehicle from '../components/Vehicle';
import Input from '@ecs/plugins/input/components/Input';
import PhysicsState from '@ecs/plugins/physics/components/PhysicsState';
import { useQueries } from '@ecs/ecs/helpers';
import Boat from '../components/Boat';
import { Vec3, Quaternion } from 'cannon-es';
import Vector3 from '@ecs/math/Vector';

const Acceleration = 0.3;
const MaxSpeed = 30;
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

		let velocity = new Vector3();
		let angularVelocity = Vector3.From(body.angularVelocity);

		if (input.upDown) {
			velocity = velocity.add(Vector3.FORWARD.multiF(Acceleration * dt));
		}

		if (input.downDown) {
			velocity = velocity.add(Vector3.BACKWARD.multiF(Acceleration * dt));
		}

		if (input.leftDown) {
			angularVelocity = angularVelocity.add(Vector3.UP.multiF(RotateAcceleration * dt));
		}

		if (input.rightDown) {
			angularVelocity = angularVelocity.add(Vector3.DOWN.multiF(RotateAcceleration * dt));
		}

		// Limit max speed
		velocity = velocity.multiF(100);
		angularVelocity = angularVelocity.multiF(0.9);

		if (body.velocity.length() < MaxSpeed) {
			body.applyLocalForce(new Vec3(velocity.x, velocity.y, velocity.z), new Vec3(0, 0, 0));
		}
		// Check if airborn

		body.velocity = body.velocity.scale(0.99);

		body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);

		const targetY = new Quaternion().setFromAxisAngle(new Vec3(1, 0, 0), Math.atan(body.velocity.y));
		const target = new Quaternion();
		target.mult(targetY, target);
		body.quaternion.slerp(target, 0.01, body.quaternion);
		body.wakeUp();
	}
}

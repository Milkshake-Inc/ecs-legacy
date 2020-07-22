import Helicopter from '../components/Helicopter';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Vehicle from '../components/Vehicle';
import Input from '@ecs/plugins/input/components/Input';
import PhysicsState from '@ecs/plugins/physics/components/PhysicsState';
import { useQueries } from '@ecs/ecs/helpers';
import { Vec3 } from 'cannon-es';
import Vector3 from '@ecs/math/Vector';
import MathHelper from '@ecs/math/MathHelper';
import { ToVector3, ToThreeVector3 } from '@ecs/plugins/physics/utils/Conversions';
import { Quaternion, Euler } from 'three';
import { Sound } from '@ecs/plugins/sound/components/Sound';

export default class HelicopterControllerSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		physics: all(PhysicsState)
	});

	constructor() {
		super(makeQuery(all(Vehicle, Helicopter, CannonBody)));
	}

	updateEntity(entity: Entity, dt: number) {
		const heli = entity.get(Helicopter);
		const sound = entity.get(Sound);

		dt = dt / 1000;

		if (entity.get(Vehicle).controller) {
			if (heli.enginePower < 1) heli.enginePower += dt * 0.2;
			if (heli.enginePower > 1) heli.enginePower = 1;
		} else {
			if (heli.enginePower > 0) heli.enginePower -= dt * 0.06;
			if (heli.enginePower < 0) heli.enginePower = 0;
		}

		if (sound) {
			sound.rate = heli.enginePower;
		}

		heli.rotors.forEach(r => r.rotateX(heli.enginePower * dt * 30));
	}

	updateEntityFixed(entity: Entity, dt: number) {
		const body = entity.get(CannonBody);
		const heli = entity.get(Helicopter);
		const input = entity.get(Input);

		if (!input) return;

		// if (input.upDown) {
		// 	body.velocity.x += body.up.x * 0.15 * heli.enginePower;
		// 	body.velocity.y += body.up.y * 0.15 * heli.enginePower;
		// 	body.velocity.z += body.up.z * 0.15 * heli.enginePower;
		// }

		// if (input.downDown) {
		// 	body.velocity.x -= body.up.x * 0.15 * heli.enginePower;
		// 	body.velocity.y -= body.up.y * 0.15 * heli.enginePower;
		// 	body.velocity.z -= body.up.z * 0.15 * heli.enginePower;
		// }
		const gravity = this.physicsState.gravity;
		let gravityCompensation = new Vec3(-gravity.x, -gravity.y, -gravity.z).length();
		gravityCompensation *= this.physicsState.frameTime || 0;
		gravityCompensation *= 0.98;
		const dot = Vector3.UP.dot(body.up);
		gravityCompensation *= Math.sqrt(MathHelper.clamp(dot, 0, 1));

		let vertDamping = ToVector3(body.velocity);
		vertDamping.x *= body.up.x;
		vertDamping.y *= body.up.y;
		vertDamping.z *= body.up.z;
		vertDamping = vertDamping.multiF(-0.01);

		const vertStab = ToVector3(body.up).multiF(gravityCompensation).multiF(Math.pow(heli.enginePower, 3)).add(vertDamping);

		body.velocity.x += vertStab.x;
		body.velocity.y += vertStab.y;
		body.velocity.z += vertStab.z;

		// Positional damping
		body.velocity.x *= 0.99;
		body.velocity.z *= 0.99;

		if (entity.get(Vehicle).controller) {
			const rotStabVelocity = new Quaternion().setFromUnitVectors(ToThreeVector3(body.up), ToThreeVector3(Vector3.UP));
			rotStabVelocity.x *= 0.3;
			rotStabVelocity.y *= 0.3;
			rotStabVelocity.z *= 0.3;
			rotStabVelocity.w *= 0.3;
			const rotStabEuler = new Euler().setFromQuaternion(rotStabVelocity);

			body.angularVelocity.x += rotStabEuler.x;
			body.angularVelocity.y += rotStabEuler.y;
			body.angularVelocity.z += rotStabEuler.z;
		}

		// Pitch
		// if (input.pitchDownDown) {
		// 	body.angularVelocity.x -= body.right.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y -= body.right.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z -= body.right.z * 0.1 * heli.enginePower;
		// }
		// if (input.pitchUpDown) {
		// 	body.angularVelocity.x += body.right.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y += body.right.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z += body.right.z * 0.1 * heli.enginePower;
		// }

		// // Yaw
		// if (input.yawLeftDown) {
		// 	body.angularVelocity.x += body.up.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y += body.up.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z += body.up.z * 0.1 * heli.enginePower;
		// }
		// if (input.yawRightDown) {
		// 	body.angularVelocity.x -= body.up.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y -= body.up.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z -= body.up.z * 0.1 * heli.enginePower;
		// }

		// // Roll
		// if (input.rightDown) {
		// 	body.angularVelocity.x -= body.forward.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y -= body.forward.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z -= body.forward.z * 0.1 * heli.enginePower;
		// }
		// if (input.leftDown) {
		// 	body.angularVelocity.x += body.forward.x * 0.1 * heli.enginePower;
		// 	body.angularVelocity.y += body.forward.y * 0.1 * heli.enginePower;
		// 	body.angularVelocity.z += body.forward.z * 0.1 * heli.enginePower;
		// }

		// Angular damping
		body.angularVelocity.x *= 0.97;
		body.angularVelocity.y *= 0.97;
		body.angularVelocity.z *= 0.97;
	}

	get physicsState() {
		return this.queries.physics.first.get(PhysicsState);
	}
}

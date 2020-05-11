import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Vector3 from '@ecs/math/Vector';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Vec3 } from 'cannon-es';
import { Quaternion, Vector3 as ThreeVector3 } from 'three';
import CharacterTag from '../components/CharacterTag';
import CharacterInput from '../components/CharacterInput';
import Input from '@ecs/plugins/input/components/Input';

export default class CharacterControllerSystem extends IterativeSystem {

	protected queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera)
	});

	constructor() {
		super(makeQuery(all(CharacterTag, Transform, CannonBody, Input)));
	}

	updateEntity(entity: Entity, dt: number) {
		this.rotateToCameraDirection(entity);
		this.moveCharacter(entity, dt);
	}

	private moveCharacter(entity: Entity, deltaTime: number) {
		const input = entity.get(Input);
		const characterCanonBody = entity.get(CannonBody);

		characterCanonBody.velocity.x *= 0.6;
		characterCanonBody.velocity.z *= 0.6;

		let impulse = new Vector3();

		const forwardSpeed = 2.5;
		const backwardsSpeed = forwardSpeed * 0.5;
		const sideSpeed = forwardSpeed * 0.5;

		if (input.upDown) {
			impulse = impulse.add(Vector3.BACKWARD.multiF(forwardSpeed));
		}

		if (input.downDown) {
			impulse = impulse.add(Vector3.FORWARD.multiF(backwardsSpeed));
		}

		if (input.rightDown) {
			impulse = impulse.add(Vector3.LEFT.multiF(sideSpeed));
		}

		if (input.leftDown) {
			impulse = impulse.add(Vector3.RIGHT.multiF(sideSpeed));
		}

		if (input.jumpDown) {
			impulse = impulse.add(Vector3.UP.multiF(6));
		}

		characterCanonBody.applyLocalImpulse(new Vec3(impulse.x, impulse.y, impulse.z), new Vec3(0, 0, 0));
	}

	private rotateToCameraDirection(entity: Entity) {
		const input = entity.get(Input);
		const characterCanonBody = entity.get(CannonBody);

		// We have to convert to ThreeQuaternion as has better helpers
		const currentQuaternion = new Quaternion(
			characterCanonBody.quaternion.x,
			characterCanonBody.quaternion.y,
			characterCanonBody.quaternion.z,
			characterCanonBody.quaternion.w
		);
		const targetQuaternion = new Quaternion().setFromAxisAngle(new ThreeVector3(0, -1, 0), input.rotation);

		const slerpQuaternion = currentQuaternion.slerp(targetQuaternion, 0.9);

		characterCanonBody.quaternion.set(slerpQuaternion.x, slerpQuaternion.y, slerpQuaternion.z, slerpQuaternion.w);
	}
}

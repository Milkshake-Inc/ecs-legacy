import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import Input from '@ecs/plugins/input/components/Input';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { Vec3 } from 'cannon-es';
import { AnimationAction, AnimationClip, AnimationMixer, PerspectiveCamera, Quaternion, Vector3 as ThreeVector3 } from 'three';
import CharacterTag from '../components/CharacterTag';
import GLTFHolder from '../../3d/components/GLTFHolder';

enum CharacterAnimationState {
	IDLE,
	RUN
}

export default class CharacterControllerSystem extends System {
	private idleClip: AnimationAction;
	private sprintClip: AnimationAction;

	private state: CharacterAnimationState = CharacterAnimationState.IDLE;
	private amimationMixed: AnimationMixer;

	protected queries = useQueries(this, {
		character: all(CharacterTag, Transform, CannonBody, Input),
		camera: all(Transform, PerspectiveCamera)
	});

	update(deltaTime: number) {
		super.update(deltaTime);
		this.rotateToCameraDirection();
		this.moveCharacter(deltaTime);
	}

	private moveCharacter(deltaTime: number) {
		if (!this.amimationMixed) {
			const gltf = this.character.get(GLTFHolder).value;
			this.amimationMixed = new AnimationMixer(gltf.scene);

			const idleAnimation = AnimationClip.findByName(gltf.animations, 'idle');
			const sprintAnimation = AnimationClip.findByName(gltf.animations, 'sprint');

			this.idleClip = this.amimationMixed.clipAction(idleAnimation);
			this.sprintClip = this.amimationMixed.clipAction(sprintAnimation);

			this.idleClip.play();
			this.sprintClip.play();
			this.sprintClip.weight = 0;
		}

		if (this.amimationMixed) {
			this.amimationMixed.update(deltaTime / 1000);
		}

		const input = this.character.get(Input);
		const characterCanonBody = this.character.get(CannonBody);

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
			impulse = impulse.add(Vector3.UP.multiF(5));
		}

		const newState = impulse.magnitude() < 0.1 ? CharacterAnimationState.IDLE : CharacterAnimationState.RUN;

		if (this.state != newState) {
			if (newState == CharacterAnimationState.IDLE) {
				this.sprintClip.weight = 0;
			}

			if (newState == CharacterAnimationState.RUN) {
				this.sprintClip.weight = 1;
			}

			this.state = newState;
		}

		characterCanonBody.applyLocalImpulse(new Vec3(impulse.x, impulse.y, impulse.z), new Vec3(0, 0, 0));
	}

	private rotateToCameraDirection() {
		const cameraTransform = this.camera.get(Transform);
		const characterTransform = this.character.get(Transform);
		const characterCanonBody = this.character.get(CannonBody);

		const directionVector = cameraTransform.position.sub(characterTransform.position).normalize();
		const directionAngle = Math.atan2(directionVector.z, directionVector.x);

		// We have to convert to ThreeQuaternion as has better helpers
		const currentQuaternion = new Quaternion(
			characterCanonBody.quaternion.x,
			characterCanonBody.quaternion.y,
			characterCanonBody.quaternion.z,
			characterCanonBody.quaternion.w
		);
		const targetQuaternion = new Quaternion().setFromAxisAngle(new ThreeVector3(0, -1, 0), directionAngle + Math.PI / 2);

		const slerpQuaternion = currentQuaternion.slerp(targetQuaternion, 0.3);

		characterCanonBody.quaternion.set(slerpQuaternion.x, slerpQuaternion.y, slerpQuaternion.z, slerpQuaternion.w);
	}

	get character() {
		return this.queries.character.first;
	}

	get camera() {
		return this.queries.camera.first;
	}
}

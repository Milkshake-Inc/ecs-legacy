import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import GLTFHolder from '../../3d/components/GLTFHolder';
import CharacterTag from '../components/CharacterTag';

enum CharacterAnimationState {
	IDLE,
	RUN
}

export class CharacterAnimation {
	idleClip: AnimationAction;
	sprintClip: AnimationAction;

	state: CharacterAnimationState = CharacterAnimationState.IDLE;
	animationMixed: AnimationMixer;
}

export default class CharacterAnimateSystem extends IterativeSystem {


	constructor() {
		super(makeQuery(all(CharacterTag, Transform, CannonBody, CharacterAnimation)));
	}

	updateEntity(entity: Entity, deltaTime: number) {
		const animationState = entity.get(CharacterAnimation);

		if (!animationState.animationMixed) {
			const gltf = entity.get(GLTFHolder).value;

			animationState.animationMixed = new AnimationMixer(gltf.scene);

			const idleAnimation = AnimationClip.findByName(gltf.animations, 'idle');
			const sprintAnimation = AnimationClip.findByName(gltf.animations, 'sprint');

			animationState.idleClip = animationState.animationMixed.clipAction(idleAnimation);
			animationState.sprintClip = animationState.animationMixed.clipAction(sprintAnimation);

			animationState.idleClip.play();
			animationState.sprintClip.play();
			animationState.sprintClip.weight = 0;
		}

		if (animationState.animationMixed) {
			animationState.animationMixed.update(deltaTime / 2000);
		}

		const cannonBody = entity.get(CannonBody);

		const newState = cannonBody.velocity.length() < 0.1 ? CharacterAnimationState.IDLE : CharacterAnimationState.RUN;

		if (animationState.state != newState) {
			if (newState == CharacterAnimationState.IDLE) {
				animationState.sprintClip.weight = 0;
			}

			if (newState == CharacterAnimationState.RUN) {
				animationState.sprintClip.weight = 1;
			}

			animationState.state = newState;
		}
	}
}

import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';

export class CharacterInputSystem extends InputSystem {
	protected queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera)
	});

	constructor() {
		super();
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		super.updateEntityFixed(entity, dt);

		// const input = entity.get(Input);

		// if (this.camera) {
		// 	const cameraTransform = this.camera.get(Transform);
		// 	const characterTransform = entity.get(Transform);

		// 	const directionVector = cameraTransform.position.sub(characterTransform.position).normalize();

		// 	input.rotation = Math.atan2(directionVector.z, directionVector.x) + Math.PI / 2;
		// }
	}

	get camera() {
		return this.queries.camera.first;
	}
}

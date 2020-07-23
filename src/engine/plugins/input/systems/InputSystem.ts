import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { QueryBuilder } from '@ecs/ecs/Query';
import Input from '../components/Input';
import { Entity } from '@ecs/ecs/Entity';
import InputManager from '@ecs/plugins/input/InputManager';

export class InputSystem extends IterativeSystem {
	private inputManager: InputManager;

	constructor() {
		super(new QueryBuilder().contains(Input).build());

		this.inputManager = new InputManager();
	}

	public updateLate(dt: number) {
		super.updateLate(dt);

		this.inputManager.update(dt);
	}

	protected updateEntityLate(entity: Entity, dt: number) {
		entity.get(Input).update(this.inputManager);
	}
}

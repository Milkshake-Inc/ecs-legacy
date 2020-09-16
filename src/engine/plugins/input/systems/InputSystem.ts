import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { QueryBuilder } from '@ecs/core/Query';
import Input from '../components/Input';
import { Entity } from '@ecs/core/Entity';
import InputManager from '@ecs/plugins/input/InputManager';

export class InputSystem extends IterativeSystem {
	private inputManager: InputManager;

	constructor() {
		super(new QueryBuilder().contains(Input).build());

		this.inputManager = new InputManager();
	}

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		this.inputManager.update(dt);
	}

	protected updateEntityFixed(entity: Entity, dt: number) {
		entity.get(Input).update(this.inputManager);
	}
}

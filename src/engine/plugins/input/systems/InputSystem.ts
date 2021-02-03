import { System, any } from 'tick-knock';
import { useQueries } from '@ecs/core/helpers';
import Input from '../components/Input';
import InputManager from '@ecs/plugins/input/InputManager';

export class InputSystem extends System {
	protected inputManager = new InputManager();
	protected queries = useQueries(this, {
		inputs: any(Input)
	});

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		this.queries.inputs.forEach(entity => {
			entity.get(Input).updateFixed(this.inputManager);
		});

		this.inputManager.updateFixed(dt);
	}

	update(deltaTime: number) {
		this.inputManager.update(deltaTime);
	}
}

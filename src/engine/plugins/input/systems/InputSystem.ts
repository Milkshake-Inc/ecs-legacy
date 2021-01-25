import { System, any } from 'tick-knock';
import { useQueries } from '@ecs/core/helpers';
import Input from '../components/Input';
import InputManager from '@ecs/plugins/input/InputManager';

export class InputSystem extends System {
	protected inputManager = new InputManager();
	protected queries = useQueries(this, {
		inputs: any(Input)
	});

	public update(dt: number, fd) {
		super.update(dt, fd);

		this.queries.inputs.forEach(entity => {
			entity.get(Input).update(this.inputManager);
		});

		this.inputManager.update(dt);
	}
}

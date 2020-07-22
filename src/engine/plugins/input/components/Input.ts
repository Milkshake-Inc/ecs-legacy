import { InputActions, InputBindings, InputStateEmpty } from '@ecs/plugins/input/Control';
import InputManager from '@ecs/plugins/input/InputManager';

export default class Input<B extends InputBindings> {
	private bindings: B;
	private inputs: InputActions<B>;

	constructor(bindings: B) {
		this.bindings = bindings;

		// Set initial inputs to empty
		const inputs = {};
		Object.keys(this.bindings).forEach(key => {
			inputs[key] = InputStateEmpty;
		});
		this.inputs = inputs;
	}

	get state() {
		return this.inputs;
	}

	update(inputManager: InputManager) {
		const inputs = {};

		Object.keys(this.bindings).forEach(key => {
			inputs[key] = this.bindings[key](inputManager);
		});

		this.inputs = inputs;
	}
}

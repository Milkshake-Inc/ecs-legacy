import { InputActions, InputBindings, InputStateEmpty } from '@ecs/plugins/input/Control';
import InputManager from '@ecs/plugins/input/InputManager';

export default class Input<B extends InputBindings> {
	public enabled = true;
	protected bindings: B;
	protected inputs: InputActions<B>;

	constructor(
		bindings: B,
		protected enabledFunc = () => {
			return this.enabled;
		}
	) {
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

	updateFixed(inputManager: InputManager) {
		const inputs = {};

		Object.keys(this.bindings).forEach(key => {
			inputs[key] = this.enabledFunc() && this.bindings[key](inputManager);
		});

		this.inputs = inputs;
	}
}

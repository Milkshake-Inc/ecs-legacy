import Key from '@ecs/input/Key';

export default class Input {
	public static WASD() {
		return new Input(Key.D, Key.A, Key.W, Key.S);
	}

	public static ARROW() {
		return new Input(Key.RIGHT, Key.LEFT, Key.UP, Key.DOWN);
	}

	constructor(
		public rightKeybinding: number,
		public leftKeybinding: number,
		public upKeybinding: number,
		public downKeybinding: number,

		public rightDown: boolean = false,
		public leftDown: boolean = false,
		public upDown: boolean = false,
		public downDown: boolean = false,
		public jumpDown: boolean = false,
		public fireDown: boolean = false
	) {}
}

export class InputHistory {
	constructor(public inputs: { [tick: number]: Input } = {}) {}
}

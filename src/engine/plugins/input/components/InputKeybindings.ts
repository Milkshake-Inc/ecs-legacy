import Key from '@ecs/input/Key';

export default class InputKeybindings {
	public static WASD() {
		return new InputKeybindings([Key.D], [Key.A], [Key.W], [Key.S]);
	}

	public static ARROW() {
		return new InputKeybindings([Key.RIGHT], [Key.LEFT], [Key.UP], [Key.DOWN]);
	}

	public static BOTH() {
		return new InputKeybindings([Key.RIGHT, Key.D], [Key.LEFT, Key.A], [Key.UP, Key.W], [Key.DOWN, Key.S]);
	}

	constructor(
		public rightKeybinding: number[] = [],
		public leftKeybinding: number[] = [],
		public upKeybinding: number[] = [],
		public downKeybinding: number[] = [],
		public jumpKeybinding: number[] = []
	) {}
}

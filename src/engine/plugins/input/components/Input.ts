export default class Input {
	constructor(
		public rightDown: boolean = false,
		public leftDown: boolean = false,
		public upDown: boolean = false,
		public downDown: boolean = false,
		public jumpDown: boolean = false,
		public fireDown: boolean = false,
		public pitchUpDown: boolean = false,
		public pitchDownDown: boolean = false,
		public yawLeftDown: boolean = false,
		public yawRightDown: boolean = false,
		public rotation = 0
	) {}
}

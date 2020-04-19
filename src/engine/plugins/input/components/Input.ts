export default class Input {
	constructor(
		public rightDown: boolean = false,
		public leftDown: boolean = false,
		public upDown: boolean = false,
		public downDown: boolean = false,
		public jumpDown: boolean = false,
		public fireDown: boolean = false
	) {}
}
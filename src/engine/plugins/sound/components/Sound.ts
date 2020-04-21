export class Sound {
	constructor(
		public src: string | string[],
		public volume = 1,
		public loop = false,
		public mute = false,
		public rate = 1,
		public play = true,
		public seek = null
	) {}
}

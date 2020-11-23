export type SoundSprite = { [name: string]: [number, number] | [number, number, boolean] };

export class Sound {
	constructor(
		public src: string | string[],
		public volume = 1,
		public loop = false,
		public mute = false,
		public rate = 1,
		public play = true,
		public playSprite: string = undefined,
		public sprite: SoundSprite = undefined,
		public seek: number = null,
		public playing = false,
		public playingSrcIndex = 0
	) {}
}

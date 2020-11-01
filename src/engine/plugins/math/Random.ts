import SeedRandom, { prng } from 'seedrandom';

export class Random {
	private rng: prng;

	constructor(seed: string | number = Date.now()) {
		this.seed(seed);
	}

	public seed(seed: string | number = Date.now()) {
		this.rng = SeedRandom(seed.toString());
	}

	public random() {
		return this.rng();
	}

	public bool(chance = 0.5): boolean {
		return this.rng() > chance;
	}

	public float(from: number, to: number): number {
		return from + (to - from) * this.rng();
	}

	public int(from: number, to: number): number {
		return Math.round(this.float(from, to));
	}

	public string(length = 10, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
		return Array(length)
			.fill(0)
			.map(x => this.int(0, characters.length))
			.map(x => characters[x])
			.join('');
	}

	public fromArray<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}

	public shuffleArray = <T>(array: T[]) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}

		return array;
	};
}

export default new Random();

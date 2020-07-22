import SeedRandom, { prng } from 'seedrandom';

export default class Random {
	private rng: prng;

	constructor(seed: string | number = Date.now()) {
		seed = seed.toString();
		this.rng = SeedRandom(seed);
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

	public fromArray<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}

	public static seed(seed: string | number) {
		return new Random(seed);
	}

	public static bool(chance = 0.5): boolean {
		return new Random().bool(chance);
	}

	public static float(from: number, to: number): number {
		return new Random().float(from, to);
	}

	public static int(from: number, to: number): number {
		return new Random().int(from, to);
	}

	public static fromArray<T>(array: T[]): T {
		return new Random().fromArray(array);
	}
}

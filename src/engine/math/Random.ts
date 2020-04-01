export default class Random {
	public static bool(chance: number = 0.5): boolean {
		return Math.random() > chance;
	}

	public static float(from: number, to: number): number {
		return from + (to - from) * Math.random();
	}

	public static int(from: number, to: number): number {
		return Math.round(this.float(from, to));
	}

	public static fromArray<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}
}

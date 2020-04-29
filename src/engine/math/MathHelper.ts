import Vector3 from './Vector';

export default class MathHelper {
	public static clamp(value: number, min: number, max: number): number {
		min = Math.min(min, max);
		max = Math.max(min, max);

		return value < min ? min : value > max ? max : value;
	}

	public static clampVector3(value: Vector3, min: Vector3, max: Vector3) {
		const result: Vector3 = value.clone();
		result.x = this.clamp(result.x, min.x, max.x);
		result.y = this.clamp(result.y, min.y, max.y);
		result.z = this.clamp(result.z, min.z, max.z);
		return result;
	}

	public static hermite(valueA: number, tangentA: number, valueB: number, tangentB: number, amount: number): number {
		const amountCubed = amount * amount * amount;
		const amountSquared = amount * amount;

		if (amount == 0) return valueA;
		if (amount == 1) return valueB;

		return (
			(2 * valueA - 2 * valueB + tangentB + tangentA) * amountCubed +
			(3 * valueB - 3 * valueA - 2 * tangentA - tangentB) * amountSquared +
			tangentA * amount +
			valueA
		);
	}

	public static map(fromMin: number, fromMax: number, toMin: number, toMax: number, value: number): number {
		return toMin + ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin);
	}

	public static deadzone(value: number, deadzone = 0.3): number {
		if (value > deadzone) {
			return MathHelper.map(deadzone, 1, 0, 1, value);
		} else if (value < -deadzone) {
			return MathHelper.map(-deadzone, -1, -0, -1, value);
		}
	}

	public static smoothStep(valueA: number, valueB: number, amount: number): number {
		return this.hermite(valueA, 0, valueB, 0, this.clamp(amount, 0, 1));
	}

	public static smoothStepVector3(valueA: Vector3, valueB: Vector3, amount: number): Vector3 {
		const result: Vector3 = new Vector3();
		result.x = this.smoothStep(valueA.x, valueB.x, amount);
		result.y = this.smoothStep(valueA.y, valueB.y, amount);
		result.z = this.smoothStep(valueA.z, valueB.z, amount);
		return result;
	}

	public static distance(valueA: number, valueB: number): number {
		return Math.abs(valueA - valueB);
	}

	public static lerp(start: number, end: number, percent: number): number {
		return start + percent * (end - start);
	}

	public static lerpVector3(start: Vector3, end: Vector3, percent: number) {
		const result: Vector3 = new Vector3();
		result.x = this.lerp(start.x, end.x, percent);
		result.y = this.lerp(start.y, end.y, percent);
		result.z = this.lerp(start.z, end.z, percent);
		return result;
	}

	public static lerpUnclamped(start: number, end: number, percent: number) {
		if (percent <= 0) return start;
		if (percent >= 1) return end;
		return start + percent * (end - start);
	}

	public static lerpAngle(start: number, end: number, percent: number): number {
		let d: number = end - start;

		if (d > Math.PI) d = d - 2 * Math.PI;
		if (d < -Math.PI) d = d + 2 * Math.PI;

		return start + d * percent;
	}

	public static unwrapRadian(radian: number): number {
		const twoPI: number = 2.0 * Math.PI;

		radian = radian % twoPI;

		if (radian > Math.PI) radian -= twoPI;
		if (radian < -Math.PI) radian += twoPI;

		return radian;
	}

	public static toDegrees(radians: number): number {
		return (radians * 180) / Math.PI;
	}

	public static toRadians(angle: number): number {
		return (angle * Math.PI) / 180;
	}

	public static vectAngle(radians: number, length = 0): { x: number; y: number } {
		return {
			x: Math.cos(radians) * length,
			y: Math.sin(radians) * length
		};
	}
}

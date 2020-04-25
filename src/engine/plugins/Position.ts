import Vector2 from '@ecs/math/Vector2';

export default class Position {
	constructor(
		public x: number = 0,
		public y: number = 0,
		public z: number = 0,
		public r: number = 0,
		public scale: Vector2 = Vector2.ONE
	) {}
}

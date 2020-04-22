import Vector2 from '@ecs/math/Vector2';

export default class ArcadePhysics {
	constructor(
		public velocity: Vector2 = Vector2.ZERO,
		public bounce: boolean = false,
		public friction: number = 0.7,
		public maxVelocity: number = Infinity,
		public isStatic: boolean = false
	) {}
}

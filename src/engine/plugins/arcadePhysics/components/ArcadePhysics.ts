import Vector3 from '@ecs/math/Vector';

export default class ArcadePhysics {
	constructor(
		public velocity: Vector3 = Vector3.ZERO,
		public bounce: boolean = false,
		public friction: number = 0.7,
		public maxVelocity: number = Infinity,
		public isStatic: boolean = false
	) {}
}

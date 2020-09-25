import Vector3 from '@ecs/plugins/math/Vector';

export default class ArcadePhysics {
	constructor(
		public velocity: Vector3 = Vector3.ZERO,
		public bounce: boolean = false,
		public friction: number = 1,
		public maxVelocity: number = Infinity,
		public isStatic: boolean = false
	) {}
}

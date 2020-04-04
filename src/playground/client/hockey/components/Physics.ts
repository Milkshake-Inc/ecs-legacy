import Vector2 from '@ecs/math/Vector2';

export default class Physics {
	constructor(public velocity: Vector2 = Vector2.ZERO, public bounce: boolean = false) {}
}

import Vector2 from '@ecs/math/Vector2';

export default class DisplayObject {
	public constructor(public scale: Vector2 = Vector2.ONE) {}
}

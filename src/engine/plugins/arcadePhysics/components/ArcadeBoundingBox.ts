import Vector3 from '@ecs/math/Vector';

export default class BoundingBox {
	constructor(public size: Vector3 = Vector3.ONE) {}
}

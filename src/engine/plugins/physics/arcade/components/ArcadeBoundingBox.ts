import Vector3 from '@ecs/plugins/math/Vector';

export default class BoundingBox {
	constructor(public size: Vector3 = Vector3.ONE) {}
}

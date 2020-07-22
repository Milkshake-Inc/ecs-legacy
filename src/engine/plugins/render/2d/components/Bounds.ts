import Vector3 from '@ecs/plugins/math/Vector';

export default class Bounds {
	public constructor(public min: Vector3, public max: Vector3) {}
}

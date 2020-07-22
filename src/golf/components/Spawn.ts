import Vector3 from '@ecs/plugins/math/Vector';

export default class Spawn {
	constructor(public index = 0, public position: Vector3) {}
}

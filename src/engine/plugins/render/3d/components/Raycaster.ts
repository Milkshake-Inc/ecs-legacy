import { Intersection } from 'three';
import Vector3 from '@ecs/plugins/math/Vector';

class RaycastBase {
	public intersects: Intersection[] = [];
}

export default class Raycast extends RaycastBase {
	public offset?: Vector3 = Vector3.ZERO;
	public direction: Vector3 = Vector3.ZERO;
	public near: 0;
	public far = Infinity;
}

export class RaycastCamera extends RaycastBase {
	public position = { x: 0, y: 0 };
}

export class RaycastDebug {
	public length = 1000;
}

import { Intersection } from 'three';
import Vector3 from '@ecs/math/Vector';

class RaycastBase {
	public intersects: Intersection[] = [];
}

export default class Raycast extends RaycastBase {
	public offset?: Vector3;
	public direction: Vector3;
}

export class RaycastCamera extends RaycastBase {
	public position = { x: 0, y: 0 };
}

export class RaycastDebug {}

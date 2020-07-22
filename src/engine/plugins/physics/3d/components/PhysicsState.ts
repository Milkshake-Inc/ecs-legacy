import { World } from 'cannon-es';
import Vector3 from '@ecs/plugins/math/Vector';

export default class PhysicsState {
	public world: World;
	public gravity: Vector3;
	public frameTime: number;
}

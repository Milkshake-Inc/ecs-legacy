import { World, Broadphase } from 'cannon-es';
import Vector3 from '@ecs/math/Vector';

export default class PhysicsState {
	public world: World;
	public broadPhase: Broadphase;
	public gravity: Vector3;
}

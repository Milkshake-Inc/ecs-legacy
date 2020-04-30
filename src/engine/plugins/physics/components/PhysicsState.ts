import { World, BroadPhase } from 'cannon';
import Vector3 from '@ecs/math/Vector';

export default class PhysicsState {
	public world: World;
	public broadPhase: BroadPhase;
	public gravity: Vector3;
}

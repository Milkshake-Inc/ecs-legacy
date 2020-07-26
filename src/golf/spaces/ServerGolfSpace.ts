import { Engine } from '@ecs/ecs/Engine';
import Vector3 from '@ecs/plugins/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/3d/systems/CannonPhysicsSystem';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import BaseGolfSpace from './BaseGolfSpace';
import { TerrainAnimationSystem } from '../systems/shared/TerrainAnimationSystem';

export class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);

		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 3));
		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
		this.addSystem(new TerrainAnimationSystem());
	}
}

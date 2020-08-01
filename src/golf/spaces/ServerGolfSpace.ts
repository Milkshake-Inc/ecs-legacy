import { Engine } from '@ecs/ecs/Engine';
import AmmoPhysicsSystem from '@ecs/plugins/physics/ammo/AmmoPhysicsSystem';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import { TerrainAnimationSystem } from '../systems/shared/TerrainAnimationSystem';
import BaseGolfSpace from './BaseGolfSpace';

export class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);

		this.addSystem(new AmmoPhysicsSystem());
		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
		this.addSystem(new TerrainAnimationSystem());
	}
}

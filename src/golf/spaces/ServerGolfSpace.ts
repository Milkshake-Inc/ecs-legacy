import { Engine } from '@ecs/ecs/Engine';
import Vector3 from '@ecs/math/Vector';
import Session from '@ecs/plugins/net/components/Session';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import GolfPlayer from '../components/GolfPlayer';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import { PlayerSpawnSystem } from '../utils/GolfShared';
import BaseGolfSpace from './BaseGolfSpace';
import { TerrainAnimationSystem } from '../systems/shared/TerrainAnimationSystem';

export class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				const session = entity.get(Session);
				entity.add(new GolfPlayer(session.id));
			})
		);

		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 3));
		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
		this.addSystem(new TerrainAnimationSystem());
	}
}



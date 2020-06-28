import { Engine } from '@ecs/ecs/Engine';
import Vector3 from '@ecs/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import PlayerBall from '../components/PlayerBall';
import { ServerBallControllerSystem } from '../systems/server/ServerBallControllerSystem';
import ServerSnapshotSystem from '../systems/server/ServerSnapshotSystem';
import { PlayerSpawnSystem } from '../utils/GolfShared';
import BaseGolfSpace from './BaseGolfSpace';
import GolfPlayer from '../components/GolfPlayer';
import Session from '@ecs/plugins/net/components/Session';
import { allRandom } from 'dog-names';

export class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
		super(engine, open);

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				// const player = this.createBall(new Vector3(0, 2, 0));
				// player.add(PlayerBall);
				// console.log('Created');
				// player.components.forEach(c => {
				// 	entity.add(c);
				// });

				//
				const session = entity.get(Session);
				entity.add(new GolfPlayer(session.id));
			})
		);

		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 3));
		this.addSystem(new ServerBallControllerSystem());
		this.addSystem(new ServerSnapshotSystem());
	}
}



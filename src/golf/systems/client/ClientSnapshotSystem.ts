import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery } from '../../utils/GolfShared';
import { deserialize } from '@ecs/plugins/physics/utils/CannonSerialize';
import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import { Snapshot } from '@geckos.io/snapshot-interpolation/lib/types';
import GolfPlayer from '../../components/GolfPlayer';

const getSessionId = (entity: Entity): string => {
	return entity.get(GolfPlayer).id;
};

export default class ClientSnapshotSystem extends ClientBasicWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected buildPlayer: (entity: Entity, local: boolean) => void;
	protected snapshotInterpolation = new SnapshotInterpolation(15)

	constructor(protected engine: Engine, playerGenerator: (entity: Entity, local: boolean) => void) {
		super();

		this.buildPlayer = playerGenerator;
	}

	createEntitiesFromSnapshot(snapshot: Snapshot) {
		const latestSnapshot = this.snapshotInterpolation.calcInterpolation("x y z");

		const ballsToRemove = new Set(this.snapshotQueries.players.entities);

		if(!latestSnapshot) return;
		// We probs want some way of creating RemoteSession on client easier...
		latestSnapshot.state.forEach(remoteSnapshot => {
			const matchingLocalBall = this.snapshotQueries.players.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == remoteSnapshot.id;
			});

			const matchingLocalSession = this.snapshotQueries.players.entities.find(entity => {
				return entity.get(GolfPlayer).id == remoteSnapshot.id;
			});

			ballsToRemove.delete(matchingLocalBall);

			// Paddle doesn't excist on client - create it!
			if (!matchingLocalBall) {
				console.log("here");



				if (matchingLocalSession) {
					console.log(`Creating local player ${remoteSnapshot.id}`);
					matchingLocalSession.add(GolfPlayer, { id: remoteSnapshot.id, color: remoteSnapshot.color as number, name: remoteSnapshot.name as string });
					this.buildPlayer(matchingLocalSession, true);
				} else {
					console.log(`Creating remote player ${remoteSnapshot.id}`);
					const entity = new Entity();
					entity.add(GolfPlayer, { id: remoteSnapshot.id, color: remoteSnapshot.color as number, name: remoteSnapshot.name as string });
					this.buildPlayer(entity, false);
					this.engine.addEntity(entity);
				}
			}
		});

		ballsToRemove.forEach(entity => {
			console.log(`Remove player ${getSessionId(entity)}`);
			this.engine.removeEntity(entity);
		});
	}

	applySnapshot(snapshot: Snapshot) {
		this.snapshotInterpolation.snapshot.add(snapshot);


	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const latestSnapshot = this.snapshotInterpolation.calcInterpolation("x y z");

		if(latestSnapshot && latestSnapshot.state.length > 0) {
			latestSnapshot.state.forEach(remoteSnapshot => {

				const localCreatedPaddle = this.snapshotQueries.players.entities.find(entity => {
					const sessionId = getSessionId(entity);
					return sessionId == remoteSnapshot.id;
				});

				if (localCreatedPaddle) {
					const body = localCreatedPaddle.get(CannonBody);

					body.position.x = remoteSnapshot.x as number;
					body.position.y = remoteSnapshot.y as number;
					body.position.z = remoteSnapshot.z as number;
				} else {
					console.log('Missing');
				}
			});
		}
	}
}

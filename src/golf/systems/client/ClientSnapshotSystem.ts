import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery, Snapshot } from '../../utils/GolfShared';
import { deserialize } from '@ecs/plugins/physics/utils/CannonSerialize';

const getSessionId = (entity: Entity): string => {
	if (entity.has(Session)) {
		const session = entity.get(Session);
		return session.id;
	}

	if (entity.has(RemoteSession)) {
		const session = entity.get(RemoteSession);
		return session.id;
	}

	return '';
};

export default class ClientSnapshotSystem extends ClientBasicWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = snapshotUseQuery(this);
	protected buildPlayer: (entity: Entity, local: boolean) => void;

	constructor(protected engine: Engine, playerGenerator: (entity: Entity, local: boolean) => void) {
		super();

		this.buildPlayer = playerGenerator;
	}

	createEntitiesFromSnapshot(snapshot: Snapshot) {
		const ballsToRemove = new Set(this.snapshotQueries.balls.entities);

		// We probs want some way of creating RemoteSession on client easier...
		snapshot.balls.forEach(remoteSnapshot => {
			const matchingLocalBall = this.snapshotQueries.balls.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == remoteSnapshot.id;
			});

			const matchingLocalSession = this.snapshotQueries.sessions.entities.find(entity => {
				return entity.get(Session).id == remoteSnapshot.id;
			});

			ballsToRemove.delete(matchingLocalBall);

			// Paddle doesn't excist on client - create it!
			if (!matchingLocalBall) {
				if (matchingLocalSession) {
					console.log(`Creating local player ${remoteSnapshot.id}`);
					this.buildPlayer(matchingLocalSession, true);
				} else {
					console.log(`Creating remote player ${remoteSnapshot.id}`);
					const entity = new Entity();
					entity.add(RemoteSession, { id: remoteSnapshot.id });
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
		snapshot.balls.forEach(remoteSnapshot => {
			const localCreatedPaddle = this.snapshotQueries.balls.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == remoteSnapshot.id;
			});

			if (localCreatedPaddle) {
				deserialize(localCreatedPaddle.get(CannonBody), remoteSnapshot.snap);
			} else {
				console.log('Missing');
			}
		});
	}
}

import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { snapshotUseQuery, Snapshot } from '../Shared';
import { deserialize } from '../utils/CannonSerialize';

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

	constructor(protected engine: Engine) {
		super();
	}

	createEntitiesFromSnapshot(snapshot: Snapshot) {
		// We probs want some way of creating RemoteSession on client easier...
		snapshot.players.forEach(remoteSnapshot => {
			const createdPlayer = this.snapshotQueries.players.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == remoteSnapshot.id;
			});

			const localSessionEntity = this.snapshotQueries.sessions.entities.find(entity => {
				return entity.get(Session).id == remoteSnapshot.id;
			});

			// Paddle doesn't excist on client - create it!
			if (!createdPlayer) {
				if (localSessionEntity) {
					console.log('Creating local player');
				} else {
					console.log('Remote ');
					const entity = new Entity();
					entity.add(RemoteSession, { id: remoteSnapshot.id });
					this.engine.addEntity(entity);
				}
			}
		});
	}

	applySnapshot(snapshot: Snapshot) {
		const boat = this.snapshotQueries.boats.first;
		const body = boat.get(CannonBody);
		deserialize(body, snapshot.boat);

		snapshot.players.forEach(remoteSnapshot => {
			const localCreatedPaddle = this.snapshotQueries.players.entities.find(entity => {
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

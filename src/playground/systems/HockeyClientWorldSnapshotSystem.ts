import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useEvents, useQueriesManual } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import { ClientHockey } from '../Client';
import { getSound } from '../constants/sound';
import { applySnapshot, generateSnapshotQueries, Snapshot as HockeySnapshot, takeSnapshot } from '../spaces/Hockey';

export class HockeyClientWorldSnapshotSystem extends ClientBasicWorldSnapshotSystem<HockeySnapshot> {
	protected engine: Engine;
	protected createPaddle: ClientHockey['createPaddle'];

	protected queries = useQueriesManual(this, generateSnapshotQueries);

	protected events = useEvents(this, {
		['GOT_GOAL']: () => {
			console.log('Cool dude!');
		}
	});

	constructor(engine: Engine, createPaddle: ClientHockey['createPaddle']) {
		super();

		this.engine = engine;
		this.createPaddle = createPaddle;
	}

	takeSnapshot() {
		return takeSnapshot(this.queries);
	}

	applySnapshot(snapshot: HockeySnapshot) {
		const currentState = this.takeSnapshot();

		if (snapshot.scores.red > currentState.scores.red || snapshot.scores.blue > currentState.scores.blue) {
			console.log('Just scored');
			const sound = new Entity();
			sound.add(getSound('win'));
			this.engine.addEntity(sound);

			this.events.dispatchGlobal('GOAL');
		}

		applySnapshot(this.queries, snapshot);
	}

	createEntitiesFromSnapshot(snapshot: HockeySnapshot) {
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

		// Remove players no longer in snapshot
		this.queries.paddles.entities.filter(localPaddle => {
			const sessionId = getSessionId(localPaddle);

			const hasLocalPaddleInSnapshot = snapshot.paddles.find(snapshot => snapshot.sessionId == sessionId);

			if (!hasLocalPaddleInSnapshot) {
				console.log('Player no longer in snapshot - Removing');
				this.engine.removeEntity(localPaddle);
			}
		});

		snapshot.paddles.forEach(remoteSnapshot => {
			const localCreatedPaddle = this.queries.paddles.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == remoteSnapshot.sessionId;
			});

			const localSessionEntity = this.queries.sessions.entities.find(entity => {
				return entity.get(Session).id == remoteSnapshot.sessionId;
			});

			// Paddle doesn't excist on client - create it!
			if (!localCreatedPaddle) {
				if (localSessionEntity) {
					console.log('Creating local player');
					this.createPaddle(localSessionEntity, remoteSnapshot.name, remoteSnapshot.color, remoteSnapshot.position);
					localSessionEntity.add(Input);
					localSessionEntity.add(InputKeybindings.BOTH());
				} else {
					const newEntity = new Entity();
					console.log('Creating remote player!');
					newEntity.add(RemoteSession, { id: remoteSnapshot.sessionId });
					newEntity.add(Input);
					this.createPaddle(newEntity, remoteSnapshot.name, remoteSnapshot.color, remoteSnapshot.position);
					this.engine.addEntity(newEntity);
				}
			}
		});
	}
}

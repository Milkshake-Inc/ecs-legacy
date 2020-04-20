import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientWorldSnapshotSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import { ClientHockey } from '../Client';
import { applySnapshot, generateSnapshotQueries, Snapshot as HockeySnapshot, takeSnapshot } from '../spaces/Hockey';
import MovementSystem from './MovementSystem';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { Body } from 'matter-js';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';

export class HockeyClientWorldSnapshotSystem extends ClientWorldSnapshotSystem<HockeySnapshot, typeof generateSnapshotQueries> {
	protected engine: Engine;
	protected createPaddle: ClientHockey['createPaddle'];

	constructor(engine: Engine, createPaddle: ClientHockey['createPaddle']) {
		super(generateSnapshotQueries);

		this.engine = engine;
		this.createPaddle = createPaddle;
	}

	takeSnapshot() {
		return takeSnapshot(this.queries);
	}

	applySnapshot(snapshot: HockeySnapshot) {
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

	runSimulation(deltaTime: number) {
		this.engine.getSystem(MovementSystem).updateFixed(deltaTime);
		// Maybe this updates static objects and puts stuff out of sync?
		this.engine.getSystem(PhysicsSystem).updateFixedApple(deltaTime);
	}

	applyPlayerInput(tick: number) {
		const currentEmulatedTickSnapshot = this.state.snapshotHistory[tick];

		const localPlayerEntity = this.queries.sessions.first;
		const localPlayerSession = localPlayerEntity.get(Session);
		const localPlayerInput = localPlayerEntity.get(Input);

		// Find our local paddle
		const localSnapshot = currentEmulatedTickSnapshot.paddles.find(paddle => paddle.sessionId == localPlayerSession.id);

		if (localSnapshot) {
			// Apply history input yo now
			Object.assign(localPlayerInput, { ...localSnapshot.input });
		}
	}
}

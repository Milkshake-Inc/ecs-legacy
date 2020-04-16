import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientPingStateQuery } from '@ecs/plugins/net/systems/ClientPingSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import { any, makeQuery } from '@ecs/utils/QueryHelper';
import { Body } from 'matter-js';
import { ClientHockey } from '../Client';
import Score from '../components/Score';
import { applySnapshot, generateSnapshotQueries, Snapshot as HockeySnapshot, Snapshot, takeSnapshot } from '../spaces/Hockey';
import MovementSystem from './MovementSystem';
import diff from 'json-diff';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';

const generateHockeyWorldSnapshotQueries = {
	...generateSnapshotQueries,
	...ClientPingStateQuery
};

const objectIsEqual = (objectA: {}, objectB: {}) => {
	return JSON.stringify(objectA) == JSON.stringify(objectB);
};

export class HockeySnapshotSyncSystem extends QueriesIterativeSystem<typeof generateHockeyWorldSnapshotQueries> {

	private snapshotHistory: Snapshot[];
	private receivedServerSnapshot: number;
	private latestAuthoritativeSnapshotTick: number;

	constructor(protected engine: Engine, protected createPaddle: ClientHockey['createPaddle']) {
		super(makeQuery(any(Session)), generateHockeyWorldSnapshotQueries);

		this.snapshotHistory = [];
	}

	updateEntityFixed(entity: Entity) {
		// Handle world packets
		const session = entity.get(Session);
		const packets = session.socket.handle<WorldSnapshot<HockeySnapshot>>(PacketOpcode.WORLD);
		packets.forEach(packet => this.updateSnapshot(packet));
	}

	updateFixed(deltaTime: number) {
		this.snapshotHistory[this.serverTick] = takeSnapshot(this.queries);

		super.updateFixed(deltaTime);
	}

	updateSnapshot({ snapshot, tick }: WorldSnapshot<HockeySnapshot>) {
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
					localSessionEntity.add(Input.BOTH());
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


		const remoteTick = tick;
		const historicLocalSnapshot = this.snapshotHistory[remoteTick];

		// We didn't proccess these frames on client
		if (remoteTick < this.receivedServerSnapshot) {
			console.log("👴🏼 Snapshot before my time");
			return;
		}

		// Old update
		if (tick < this.latestAuthoritativeSnapshotTick) {
			console.log("👴🏼 Received old/out-of-order packet - Ignoring.");
			return;
		}

		// We have this snapshot
		if (historicLocalSnapshot) {

			const historyMatchesServer = objectIsEqual(historicLocalSnapshot, snapshot);

			if(!historyMatchesServer) {
				console.log("🔌 Out of sync diff - Client diff to server");
				console.log(diff.diffString(historicLocalSnapshot, snapshot));

				applySnapshot(this.queries, snapshot);

				// Over ride the old snapshot with the servers new one
				Object.assign(historicLocalSnapshot, takeSnapshot(this.queries));

				// Check what we've applied is right
				const appliedCorrectly = objectIsEqual(historicLocalSnapshot, snapshot);

				if(!appliedCorrectly) {
					console.log("🛑 Couldn't apply serverSnapshot!")
					console.log(diff.diffString(historicLocalSnapshot, snapshot));
				}

				this.latestAuthoritativeSnapshotTick = tick;

				// Revert time back to server snapshots tick
				console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick} (${this.serverTick - remoteTick}ticks)`);

				// Since we've applied the servers results of remoteTick, we start applying updates on
				// the ticks after (let currentEmulatedTick = remoteTick + 1)
				for (let currentEmulatedTick = remoteTick + 1; currentEmulatedTick <= this.serverTick; currentEmulatedTick++) {
					const currentEmulatedTickSnapshot = this.snapshotHistory[currentEmulatedTick];

					// WE NEED TO APPLY THE PLAYERS INPUT FOR THIS FRAME
					// Bit of a hack?
					const localPlayerEntity = this.queries.sessions.first;
					const localPlayerSession = localPlayerEntity.get(Session);
					const localPlayerInput = localPlayerEntity.get(Input);

					const localSnapshot = currentEmulatedTickSnapshot.paddles.find((paddle) => paddle.sessionId == localPlayerSession.id);

					if(localSnapshot) {
						Object.assign(localPlayerInput, { ...localSnapshot.input });
					}

					// Re-run systems that effect these entities - maybe call updateEntity manually be better?
					this.engine.getSystem(MovementSystem).updateFixed(1000 / 60);
					this.engine.getSystem(PhysicsSystem).updateFixed(1000 / 60);

					// Store this newly generated snapshot from an authorative server snapshot in history
					this.snapshotHistory[currentEmulatedTick] = takeSnapshot(this.queries);
				}
			}
		}

		this.receivedServerSnapshot = tick;
	}

	get serverTick() {
		return this.queries.pingState.first.get(ClientPingState).serverTick;
	}
}

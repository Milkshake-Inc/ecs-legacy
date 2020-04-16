import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientPingStateQuery } from '@ecs/plugins/net/systems/ClientPingSystem';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { Body } from 'matter-js';
import { ClientHockey } from '../Client';
import { Paddle } from '../components/Paddle';
import { Player } from '../components/Player';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { Snapshot as HockeySnapshot, SnapshotPhysicsEntity, Snapshot, PaddleSnapshotEntity, takeSnapshot, applySnapshot } from '../spaces/Hockey';
import MovementSystem from './MovementSystem';
import { Name } from '../components/Name';
import diff from 'json-diff';

const generateHockeyWorldSnapshotQueries = {
	input: makeQuery(all(Input)),
	sessions: makeQuery(all(Session)),
	paddles: makeQuery(all(Paddle)),
	puck: makeQuery(all(Puck)),
	score: makeQuery(all(Score)),
	...ClientPingStateQuery
};

const generatePlayerPhysicsSnapshot = (entity: Entity) => {
	const input = entity.get(Input);

	return {
		input: { ...input },
		...generatePhysicsSnapshot(entity)
	};
};

const generatePhysicsSnapshot = (entity: Entity) => {
	const physicsBody = entity.get(PhysicsBody);

	return {
		position: { ...physicsBody.position },
		velocity: { ...physicsBody.velocity }
	};
};



const objectIsEqual = (objectA: {}, objectB: {}) => {
	return JSON.stringify(objectA) == JSON.stringify(objectB);
};

const objectIsEqualPrint = (objectA: {}, objectB: {}) => {
	console.log(JSON.stringify(objectA));
	console.log(JSON.stringify(objectB));
	return objectIsEqual(objectA, objectB)
};

enum NetworkType {
	APPLY,
	REWIND,
}

export class HockeySnapshotSyncSystem extends QueriesIterativeSystem<typeof generateHockeyWorldSnapshotQueries> {
	private snapshotHistory: Snapshot[];

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
	private gotFirstSnapshotOnTick: number;

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
					this.createPaddle(newEntity, remoteSnapshot.name, remoteSnapshot.color, remoteSnapshot.position);
					this.engine.addEntity(newEntity);
				}
			}
		});

		// console.log(this.queries.puck.first?.get(PhysicsBody).body);
		// It's our player
		const remoteTick = tick;
		const historicLocalSnapshot = this.snapshotHistory[remoteTick];

		// We didn't proccess these frames on client
		if (remoteTick < this.gotFirstSnapshotOnTick) return;

		// We have this snapshot
		if (historicLocalSnapshot) {

			const historyMatchesServer = objectIsEqual(historicLocalSnapshot, snapshot);

			if(!historyMatchesServer) {

				console.log(diff.diffString(historicLocalSnapshot, snapshot));

				applySnapshot(this.queries, snapshot);

				// Over ride the old snapshot with the servers new one
				Object.assign(historicLocalSnapshot, takeSnapshot(this.queries));

				// Check what we've applied is right
				const appliedCorrectly = objectIsEqual(historicLocalSnapshot, snapshot);

				console.log(appliedCorrectly ? `👍 Applied server snapshot over clients` : `👎 Oh no.`);

				// Revert time back to server snapshots tick
				console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick}`);

				// Since we've applied the servers results of remoteTick, we start applying updates on
				// the ticks after (let currentEmulatedTick = remoteTick + 1)
				for (let currentEmulatedTick = remoteTick + 1; currentEmulatedTick <= this.serverTick; currentEmulatedTick++) {
					const currentEmulatedTickSnapshot = this.snapshotHistory[currentEmulatedTick];


					// WE NEED TO APPLY THE PLAYERS INPUT FOR THIS FRAME
					const localPlayerEntity = this.queries.sessions.first;
					const localPlayerSession = localPlayerEntity.get(Session);
					const localPlayerInput = localPlayerEntity.get(Input);

					const localSnapshot = currentEmulatedTickSnapshot.paddles.find((paddle) => paddle.sessionId == localPlayerSession.id);

					Object.assign(localPlayerInput, localSnapshot.input);

					this.engine.getSystem(MovementSystem).updateFixed(1000 / 60);
					PhysicsSystem.engineUpdate(1000 / 60);

					// Store this newly generated snapshot from an authorative server snapshot in history
					this.snapshotHistory[currentEmulatedTick] = takeSnapshot(this.queries);
					// this.puckHistory[currentEmulatedTick] = generatePhysicsSnapshot(this.queries.puck.first);
				}
			}

			// if(!appliedCorrectly) {
				// console.log("Did't apply");
			// }
			// debugger;

			// // Miss-match detected - apply servers snapshot to historicLocalSnapshot
			// if (!perfectMatch || !perfectMatchPuck) {

			// 	console.log(`🐥 Out of sync with server.`);

			// 	// Override playerHistory with remoteSnapshot
			// 	Object.assign(this.playerHistory[remoteTick], filteredRemoteSnapshot);

			// 	// Love puck
			// 	Object.assign(this.puckHistory[remoteTick], snapshot.puck);

			// 	// Double check not needed - but for my sanity
			// 	const doubleCheckPerfectMatch = objectIsEqual(this.playerHistory[remoteTick], filteredRemoteSnapshot);

			// 	console.log(doubleCheckPerfectMatch ? `👍 Applied server snapshot over clients` : `👎 Oh no.`);

			// 	// Revert time back to server snapshots tick
			// 	console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick}`);

			// 	// Apply the *NEWLY* updated historicLocalSnapshot to the entity
			// 	applePhysicsSnapshot(localSessionEntity, historicLocalSnapshot);
			// 	applePhysicsSnapshot(this.queries.puck.first, this.puckHistory[remoteTick]);

			// 	// And input from that snapshot
			// 	const localPlayersInput = localSessionEntity.get(Input);
			// 	Object.assign(localPlayersInput, historicLocalSnapshot.input);

			// 	// Should be rebuilt perectly.
			// 	const snapshotOfThisRebuiltFrame = generatePlayerPhysicsSnapshot(localSessionEntity);

			// 	const rebuiltRight = objectIsEqual(snapshotOfThisRebuiltFrame, filteredRemoteSnapshot);

			// 	if (!rebuiltRight) {
			// 		debugger;
			// 		console.error("Applied snapshot doesn't look like received!");
			// 	}

			// 	// Since we've applied the servers results of remoteTick, we start applying updates on
			// 	// the ticks after (let currentEmulatedTick = remoteTick + 1)
			// 	for (let currentEmulatedTick = remoteTick + 1; currentEmulatedTick <= this.serverTick; currentEmulatedTick++) {
			// 		const currentEmulatedTickSnapshot = this.playerHistory[currentEmulatedTick];

			// 		const localPlayersInput = localSessionEntity.get(Input);
			// 		Object.assign(localPlayersInput, currentEmulatedTickSnapshot.input);

			// 		MovementSystem.updateEntityFixed(localSessionEntity, 1000 / 60);
			// 		PhysicsSystem.engineUpdate(1000 / 60);

			// 		PhysicsSystem.updateEntityFixed(localSessionEntity, 1000 / 60);
			// 		PhysicsSystem.updateEntityFixed(this.queries.puck.first, 1000 / 60);

			// 		// Store this newly generated snapshot from an authorative server snapshot in history
			// 		this.playerHistory[currentEmulatedTick] = generatePlayerPhysicsSnapshot(localSessionEntity);
			// 		this.puckHistory[currentEmulatedTick] = generatePhysicsSnapshot(this.queries.puck.first);
			// 	}
			// }
		}

		const score = this.queries.score.first.get(Score);
		Object.assign(score, snapshot.scores);

		this.gotFirstSnapshotOnTick = tick;
	}

	public bodyAsJson = (body: Body) =>
		JSON.stringify(body, (key, value) => (key === 'parent' || key === 'parts' || key === 'body' ? undefined : value));

	private compareWot(objectA: {}, objectB: {}) {
		const a = Object.entries(objectA).toString();
		const b = Object.entries(objectB).toString();

		console.log(a);
		console.log(b);

		return a == b;
	}

	private comparePrint(objectA: {}, objectB: {}) {
		const diff = {};
		Object.keys(objectA).forEach(key => {
			const a = objectA[key];
			const b = objectB[key];
			diff[key] = typeof a == 'number' ? a - b : 'unknown';
		});
		console.table({ client: objectA, server: objectB, diff });
	}

	get serverTick() {
		return this.queries.pingState.first.get(ClientPingState).serverTick;
	}
}

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
import { Snapshot as HockeySnapshot, SnapshotPhysicsEntity } from '../spaces/Hockey';
import MovementSystem from './MovementSystem';

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

const applePhysicsSnapshot = (entity: Entity, snapshot: SnapshotPhysicsEntity) => {
	const physics = entity.get(PhysicsBody);

	physics.position = {
		x: snapshot.position.x,
		y: snapshot.position.y
	};

	physics.velocity = {
		x: snapshot.velocity.x,
		y: snapshot.velocity.y
	};
};

const objectIsEqual = (objectA: {}, objectB: {}) => {
	return JSON.stringify(objectA) == JSON.stringify(objectB);
};

// const comparePhysicsSnapshot = (snapshotA: SnapshotPhysicsEntity, snapshotB: SnapshotPhysicsEntity) => {
// 	const position = objectIsEqual(snapshotA.position, snapshotB.position);
// 	const velocity = objectIsEqual(snapshotA.velocity, snapshotB.velocity);
// 	return objectIsEqual(position && velocity;
// };

export class HockeySnapshotSyncSystem extends QueriesIterativeSystem<typeof generateHockeyWorldSnapshotQueries> {
	// Maybe this should just be WORLD_SNAPSHOTS
	private playerHistory: (SnapshotPhysicsEntity & { input: Input })[];
	private puckHistory: SnapshotPhysicsEntity[];

	constructor(protected engine: Engine, protected createPaddle: ClientHockey['createPaddle']) {
		super(makeQuery(any(Session)), generateHockeyWorldSnapshotQueries);

		this.playerHistory = [];
		this.puckHistory = [];
	}

	get serverTick() {
		return this.queries.pingState.first.get(ClientPingState).serverTick;
	}

	updateEntityFixed(entity: Entity) {
		const session = entity.get(Session);

		if (entity.has(Player)) {
			this.playerHistory[this.serverTick] = generatePlayerPhysicsSnapshot(entity);
		}

		// Handle world packets
		const packets = session.socket.handle<WorldSnapshot<HockeySnapshot>>(PacketOpcode.WORLD);
		packets.forEach(packet => this.updateSnapshot(packet));
	}

	updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		const puck = this.queries.puck.first;
		this.puckHistory[this.serverTick] = generatePhysicsSnapshot(puck);
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


		const perfectMatchPuck = objectIsEqual(this.puckHistory[tick], snapshot.puck);
		// Apply physics to puck
		if(!perfectMatchPuck) {
			console.log("Puck wrong");
		}


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
			} else {
				if (localSessionEntity) {
					// It's our player
					const remoteTick = tick; // Hack not sure why one a head?
					const historicLocalSnapshot = this.playerHistory[remoteTick];

					if (historicLocalSnapshot) {
						// remoteSnapshot contains more than needed, so obj compare wont work.
						const filteredRemoteSnapshot = {
							input: remoteSnapshot.input,
							position: remoteSnapshot.position,
							velocity: remoteSnapshot.velocity
						};

						// Checks position, velocity & input match servers
						const perfectMatch = objectIsEqual(historicLocalSnapshot, filteredRemoteSnapshot);

						// Miss-match detected - apply servers snapshot to historicLocalSnapshot
						if (!perfectMatch || !perfectMatchPuck) {

							console.log(`🐥 Out of sync with server.`);

							// Override playerHistory with remoteSnapshot
							Object.assign(this.playerHistory[remoteTick], filteredRemoteSnapshot);

							// Love puck
							Object.assign(this.puckHistory[remoteTick], generatePhysicsSnapshot(localSessionEntity));

							// Double check not needed - but for my sanity
							const doubleCheckPerfectMatch = objectIsEqual(this.playerHistory[remoteTick], filteredRemoteSnapshot);

							console.log(doubleCheckPerfectMatch ? `👍 Applied server snapshot over clients` : `👎 Oh no.`);

							// Revert time back to server snapshots tick
							console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick}`);

							// Apply the *NEWLY* updated historicLocalSnapshot to the entity
							applePhysicsSnapshot(localSessionEntity, historicLocalSnapshot);
							applePhysicsSnapshot(this.queries.puck.first, snapshot.puck);


							// And input from that snapshot
							const localPlayersInput = localSessionEntity.get(Input);
							Object.assign(localPlayersInput, historicLocalSnapshot.input);

							// Should be rebuilt perectly.
							const snapshotOfThisRebuiltFrame = generatePlayerPhysicsSnapshot(localSessionEntity);

							const rebuiltRight = objectIsEqual(snapshotOfThisRebuiltFrame, filteredRemoteSnapshot);

							if (!rebuiltRight) {
								debugger;
								console.error("Applied snapshot doesn't look like received!");
							}

							// Since we've applied the servers results of remoteTick, we start applying updates on
							// the ticks after (let currentEmulatedTick = remoteTick + 1)
							for (let currentEmulatedTick = remoteTick + 1; currentEmulatedTick <= this.serverTick; currentEmulatedTick++) {
								const currentEmulatedTickSnapshot = this.playerHistory[currentEmulatedTick];

								const localPlayersInput = localSessionEntity.get(Input);
								Object.assign(localPlayersInput, currentEmulatedTickSnapshot.input);

								MovementSystem.updateEntityFixed(localSessionEntity, 1000 / 60);
								PhysicsSystem.engineUpdate(1000 / 60);

								PhysicsSystem.updateEntityFixed(localSessionEntity, 1000 / 60);
								PhysicsSystem.updateEntityFixed(this.queries.puck.first, 1000 / 60);

								// Store this newly generated snapshot from an authorative server snapshot in history
								this.playerHistory[currentEmulatedTick] = generatePlayerPhysicsSnapshot(localSessionEntity);
							}
						}
					}
				}
			}
		});

		const score = this.queries.score.first.get(Score);
		Object.assign(score, snapshot.scores);
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
}

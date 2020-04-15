import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { ClientHockey } from '../Client';
import { Paddle } from '../components/Paddle';
import { Player } from '../components/Player';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { PaddleSnapshotEntity, Snapshot as HockeySnapshot, SnapshotEntity } from '../spaces/Hockey';
import { ClientPingStateQuery } from '@ecs/plugins/net/systems/ClientPingSystem';
import MovementSystem from './MovementSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import { Body } from 'matter-js';

const generateHockeyWorldSnapshotQueries = {
	input: makeQuery(all(Input)),
	sessions: makeQuery(all(Session)),
	paddles: makeQuery(all(Paddle)),
	puck: makeQuery(all(Puck)),
	score: makeQuery(all(Score)),
	...ClientPingStateQuery
}

export class HockeySnapshotSyncSystem extends QueriesIterativeSystem<typeof generateHockeyWorldSnapshotQueries> {
	private playerHistory: Omit<PaddleSnapshotEntity, 'color' | 'sessionId' | 'name'>[];

	constructor(protected engine: Engine, protected createPaddle: ClientHockey['createPaddle']) {
		super(makeQuery(any(Session)), generateHockeyWorldSnapshotQueries);

		this.playerHistory = [];
	}

	get serverTick() {
		return this.queries.pingState.first.get(ClientPingState).serverTick;
	}

	updateEntityFixed(entity: Entity) {
		const session = entity.get(Session);

		if (entity.has(Player)) {
			const physicsBody = entity.get(PhysicsBody);
			const input = entity.get(Input);

			this.playerHistory[this.serverTick] = {
				position: { ...physicsBody.position },
				velocity: { ...physicsBody.velocity },
				input: { ...input }
			};
		}

		// Handle world packets
		const packets = session.socket.handle<WorldSnapshot<HockeySnapshot>>(PacketOpcode.WORLD);
		packets.forEach(packet => this.updateSnapshot(packet));
	}

	updateSnapshot({ snapshot, tick }: WorldSnapshot<HockeySnapshot>) {
		const processEntity = (entity: Entity, snapshot: SnapshotEntity) => {
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

		// Apply physics to puck
		processEntity(this.queries.puck.first, snapshot.puck);

		snapshot.paddles.forEach(snapshotPaddle => {
			const localCreatedPaddle = this.queries.paddles.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == snapshotPaddle.sessionId;
			});

			const localSessionEntity = this.queries.sessions.entities.find(entity => {
				return entity.get(Session).id == snapshotPaddle.sessionId;
			});

			// Paddle doesn't excist on client - create it!
			if (!localCreatedPaddle) {
				if (localSessionEntity) {
					console.log('Creating local player');
					this.createPaddle(localSessionEntity, snapshotPaddle.name, snapshotPaddle.color, snapshotPaddle.position);
					localSessionEntity.add(Input.BOTH());
				} else {
					const newEntity = new Entity();
					console.log('Creating remote player!');
					newEntity.add(RemoteSession, { id: snapshotPaddle.sessionId });
					this.createPaddle(newEntity, snapshotPaddle.name, snapshotPaddle.color, snapshotPaddle.position);
					this.engine.addEntity(newEntity);
				}
			} else {
				if (localSessionEntity) {
					// It's our player
					const remoteTick = tick; // Hack not sure why one a head?
					const localSnapshot = this.playerHistory[remoteTick];

					let needRewind = false;

					if (snapshotPaddle?.input && localSnapshot?.input) {
						if(!this.compare(localSnapshot.input, snapshotPaddle.input)) {
							console.log('❗️ Input out of sync');
							this.comparePrint(localSnapshot.input, snapshotPaddle.input)
							Object.assign(localSnapshot.input, snapshotPaddle.input);
							// this.comparePrint(localSnapshot.input, snapshotPaddle.input)
							// console.log(!this.compare(localSnapshot.input, snapshotPaddle.input) ? '👎 Wrong' : '👍 Now syned');
							needRewind = true;
						}
					}

					if (snapshotPaddle?.position && localSnapshot?.position) {
						if(!this.compare(localSnapshot.position, snapshotPaddle.position)) {
							console.log('❗️Position out of sync');
							this.comparePrint(localSnapshot.position, snapshotPaddle.position)
							Object.assign(localSnapshot.position, snapshotPaddle.position);
							// this.comparePrint(localSnapshot.position, snapshotPaddle.position)
							// console.log(!this.compare(localSnapshot.position, snapshotPaddle.position) ? '👎 Wrong' : '👍 Now syned');
							needRewind = true;
						}
					}

					if (snapshotPaddle?.velocity && localSnapshot?.velocity) {
						if(!this.compare(localSnapshot.velocity, snapshotPaddle.velocity)) {
							console.log('❗Velocity out of sync');
							this.comparePrint(localSnapshot.velocity, snapshotPaddle.velocity)
							Object.assign(localSnapshot.velocity, snapshotPaddle.velocity);
							// this.comparePrint(localSnapshot.velocity, snapshotPaddle.velocity)
							// console.log(!this.compare(localSnapshot.velocity, snapshotPaddle.velocity) ? '👎 Wrong' : '👍 Now syned');
							needRewind = true;
						}
					}

					if(needRewind) {
						console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick}`)

						// Place puck back
						processEntity(this.queries.puck.first, snapshot.puck);

						const localPlayersPhysicsBody = localSessionEntity.get(PhysicsBody);

						// Apply the server snap shot for this frame
						localPlayersPhysicsBody.velocity = {
							x: localSnapshot.velocity.x,
							y: localSnapshot.velocity.y,
						}

						localPlayersPhysicsBody.position = {
							x: localSnapshot.position.x,
							y: localSnapshot.position.y,
						}

						const localPlayersInput = localSessionEntity.get(Input);
						Object.assign(localPlayersInput, localSnapshot.input);

						// Should be rebuilt perectly.

						const snapshotOfThisRebuiltFrame = {
							position: { ...localPlayersPhysicsBody.position },
							velocity: { ...localPlayersPhysicsBody.velocity },
							input: { ...localPlayersInput }
						};

						const positionRight = this.compare(snapshotPaddle.position, snapshotOfThisRebuiltFrame.position);
						const velocityRight = this.compare(snapshotPaddle.velocity, snapshotOfThisRebuiltFrame.velocity);
						const inputRight = this.compare(snapshotPaddle.input, snapshotOfThisRebuiltFrame.input);

						if(!positionRight || !velocityRight || !inputRight) {
							console.warn("Applied snapshot doesn't look like recived!")
						}

						for (
							let currentEmulatedTick = remoteTick;
							currentEmulatedTick <= this.serverTick;
							currentEmulatedTick++
						) {
							const firstFrame = currentEmulatedTick == remoteTick;
							const lastFrame = currentEmulatedTick == this.serverTick;

							// Apply recorded input for that frame
							if(!firstFrame){
								const currentEmulatedTickSnapshot = this.playerHistory[currentEmulatedTick];

								const localPlayersInput = localSessionEntity.get(Input);
								Object.assign(localPlayersInput, currentEmulatedTickSnapshot.input);

								MovementSystem.updateEntityFixed(localSessionEntity, 1000 / 60);
								PhysicsSystem.engineUpdate(1000 / 60);

								PhysicsSystem.updateEntityFixed(localSessionEntity, 1000 / 60)
								PhysicsSystem.updateEntityFixed(this.queries.puck.first, 1000 / 60)

								// Serialise
							}

							// REBUILD THERE SNAPSHOT
							const physicsBody = localSessionEntity.get(PhysicsBody);
							const input = localSessionEntity.get(Input);

							this.playerHistory[currentEmulatedTick] = {
								position: { ...physicsBody.position },
								velocity: { ...physicsBody.velocity },
								input: { ...input }
							};


						// }
						}
					}
				}
			}
		});

		const score = this.queries.score.first.get(Score);
		Object.assign(score, snapshot.scores);
	}

	public bodyAsJson = (body: Body) => JSON.stringify(body, (key, value) =>
  (key === 'parent' || key === 'parts' || key === 'body') ? undefined : value);

	private compare(objectA: {}, objectB: {}) {
		return Object.entries(objectA).toString() == Object.entries(objectB).toString()
	}

	private compareWot(objectA: {}, objectB: {}) {
		const a = Object.entries(objectA).toString();
		const b = Object.entries(objectB).toString();

		console.log(a);
		console.log(b);

		return a == b;
	}

	private comparePrint(objectA: {}, objectB: {}) {
		const diff = {};
		Object.keys(objectA).forEach((key) => {
			const a = objectA[key];
			const b = objectB[key];
			diff[key] = typeof(a) == "number" ? a - b : "unknown";
		})
		console.table({client: objectA, server: objectB, diff });
	}
}

import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { QueriesIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { Paddle } from '../components/Paddle';
import { Puck } from '../components/Puck';
import Score from '../components/Score';
import { ClientHockey } from '../Client';
import { Snapshot as HockeySnapshot, SnapshotEntity, PaddleSnapshotEntity } from '../spaces/Hockey';
import Position from '@ecs/plugins/Position';
import { Player } from '../components/Player';
import MovementSystem from './MovementSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';

const generateHockeyWorldSnapshotQueries = () => {
	return {
		input: makeQuery(all(Input)),
		sessions: makeQuery(all(Session)),
		paddles: makeQuery(all(Paddle)),
		puck: makeQuery(all(Puck)),
		score: makeQuery(all(Score))
	};
};

export class HockeySnapshotSyncSystem extends QueriesIterativeSystem<ReturnType<typeof generateHockeyWorldSnapshotQueries>> {
	private playerHistory: Omit<PaddleSnapshotEntity, 'color' | 'sessionId' | 'name'>[];

	constructor(protected engine: Engine, protected createPaddle: ClientHockey['createPaddle']) {
		super(makeQuery(any(Session)), generateHockeyWorldSnapshotQueries());

		this.playerHistory = [];
	}

	updateEntityFixed(entity: Entity) {
		const session = entity.get(Session);

		// Handle world packets
		const packets = session.socket.handle<WorldSnapshot<HockeySnapshot>>(PacketOpcode.WORLD);
		packets.forEach(packet => this.updateSnapshot(packet));

		if (entity.has(Player)) {
			const physicsBody = entity.get(PhysicsBody);
			const input = entity.get(Input);

			this.playerHistory[session.serverTick] = {
				position: { ...physicsBody.position },
				velocity: { ...physicsBody.velocity },
				input: { ...input }
			};
		}
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

		this.queries.paddles.entities.filter(localPaddle => {
			const sessionId = getSessionId(localPaddle);

			const hasLocalPaddleInSnapshot = snapshot.paddles.find(snapshot => snapshot.sessionId == sessionId);

			if (!hasLocalPaddleInSnapshot) {
				console.log('Player no longer in snapshot - Removing');
				this.engine.removeEntity(localPaddle);
			}
		});

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

					if (snapshotPaddle?.input && localSnapshot?.input) {
						const up = localSnapshot.input.upDown != snapshotPaddle.input.upDown;
						const down = localSnapshot.input.downDown != snapshotPaddle.input.downDown;
						const left = localSnapshot.input.leftDown != snapshotPaddle.input.leftDown;
						const right = localSnapshot.input.rightDown != snapshotPaddle.input.rightDown;

						if (up || down || left || right) {
							console.log('⚠️ Input out of sync');
						}
					} else {
						// console.log("Remote doesnt have input yet")
					}
					if (snapshotPaddle?.position && localSnapshot?.position) {
						const localSnapshot = this.playerHistory[remoteTick]; // Three a head wtf - it's like ?

						if (localSnapshot) {
							const positionOutOfSync =
								snapshotPaddle.position.x !== localSnapshot.position.x ||
								snapshotPaddle.position.y !== localSnapshot.position.y;

							if (positionOutOfSync) {
								console.log(
									`😞 Out of Sync - Server(${tick}) vs Client(${tick})
S: UP: ${snapshotPaddle.input.upDown} UP: ${localSnapshot.input.upDown}
S: Y: ${snapshotPaddle.position.y} C: ${localSnapshot.position.y}`
								);

								processEntity(localCreatedPaddle, snapshotPaddle);
								Object.assign(localCreatedPaddle.get(Input), snapshotPaddle.input);
								const pos = localCreatedPaddle.get(PhysicsBody);
								const positionOutOfSync =
									snapshotPaddle.position.x !== pos.position.x ||
									snapshotPaddle.position.y !== pos.position.y;

									// debugger;
								if (positionOutOfSync) {
									debugger;
									console.log(
										`😞 Out of Sync AGAIN`
									);
								} else {
									console.log("Remapped well")
								}

								console.log("Fast foward " + remoteTick + " -> " + localCreatedPaddle.get(Session).serverTick);

								for (
									let currentEmulatedTick = remoteTick;
									currentEmulatedTick < localCreatedPaddle.get(Session).serverTick;
									currentEmulatedTick++
								) {
									// Apply recorded input for that frame
									if (this.playerHistory[currentEmulatedTick]) {
										Object.assign(localCreatedPaddle.get(Input), this.playerHistory[currentEmulatedTick].input);
									}

									MovementSystem.updateEntityFixed(localCreatedPaddle, 1000 / 60);
									PhysicsSystem.engineUpdate(1000 / 60);
								}

								//
							}
						}
					}
				}

				// console.log(localCreatedPaddle.get(Position))
			}

			// if(localSnapshot && localCreatedPaddle.has(Session)) {
			// }

			// 	if(snapshotPaddle.input) {
			// 		const inputOutOfSync = snapshotPaddle.input.upDown != localSnapshot.input.upDown
			// 		|| snapshotPaddle.input.downDown != localSnapshot.input.downDown
			// 		|| snapshotPaddle.input.rightDown != localSnapshot.input.rightDown
			// 		|| snapshotPaddle.input.leftDown != localSnapshot.input.leftDown;

			// 		if(inputOutOfSync) {
			// 			console.log("Input - out of sync");
			// 		} else {
			// 			if(localSnapshot.input?.upDown) {
			// 				// debugger;
			// 			}
			// 		}
			// 	} else {
			// 		console.log("Snapshot doesn't have input for this frame?!")
			// 	}

			// const positionOutOfSync =
			// 	Math.round(snapshotPaddle.position.x) != Math.round(localSnapshot.position.x) ||
			// 	Math.round(snapshotPaddle.position.y) != Math.round(localSnapshot.position.y);

			// if(positionOutOfSync) {
			// 	const lastFrame = remoteTick ;
			// 	const lastFrameSnapshot = this.playerHistory[lastFrame];

			// 	console.log(lastFrameSnapshot.position.x + " vs " + localSnapshot.position.x);

			// 	console.log("Position - out of sync");
			// }

			// if(pressedArrow) {
			// 	console.log("next frame");
			// 	debugger;
			// } else {
			// 	if(snapshotPaddle.input?.upDown) {
			// 		pressedArrow = true;
			// 		console.log("snapped press arrow");
			// 		debugger;
			// 	}
			// }
			// }

			// }
		});

		const score = this.queries.score.first.get(Score);
		Object.assign(score, snapshot.scores);
	}
}

// const pressedArrow = false;

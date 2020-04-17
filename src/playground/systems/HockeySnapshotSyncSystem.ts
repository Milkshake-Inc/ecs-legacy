import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { StatefulIterativeSystem, QueriesSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Input from '@ecs/plugins/input/components/Input';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { PacketOpcode, WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { ClientPingStateQuery } from '@ecs/plugins/net/systems/ClientPingSystem';
import PhysicsSystem from '@ecs/plugins/physics/systems/PhysicsSystem';
import { any, makeQuery, all } from '@ecs/utils/QueryHelper';
import diff from 'json-diff';
import { ClientHockey } from '../Client';
import { applySnapshot, generateSnapshotQueries, Snapshot as HockeySnapshot, Snapshot, takeSnapshot } from '../spaces/Hockey';
import MovementSystem from './MovementSystem';
import { Graphics } from 'pixi.js';
import Position from '@ecs/plugins/Position';
import Color from '@ecs/math/Color';



const generateHockeyWorldSnapshotQueries = {
	...generateSnapshotQueries,
	...ClientPingStateQuery
};

const objectIsEqual = (objectA: {}, objectB: {}) => {
	return JSON.stringify(objectA) == JSON.stringify(objectB);
};

class HockeySnapshotSyncState {
	public snapshotHistory: Snapshot[];
	public receivedServerSnapshot: number;
	public latestAuthoritativeSnapshotTick: number;

	public snapshotsRewrote: number[];

	constructor() {
		this.snapshotHistory = [];
		this.receivedServerSnapshot = 0;
		this.latestAuthoritativeSnapshotTick = 0;
		this.snapshotsRewrote = [];
	}
}

// Helper func for this
const getHockeySnapshotSyncState = {
	snapshotState: makeQuery(all(HockeySnapshotSyncState))
}

export class HockeySnapshotSyncDebugSystem extends QueriesSystem<typeof getHockeySnapshotSyncState & typeof ClientPingStateQuery> {

	private graphics: Graphics;

	constructor() {
		super({
			...getHockeySnapshotSyncState,
			...ClientPingStateQuery,
		})
	}

	public onAddedToEngine(engine: Engine) {

		super.onAddedToEngine(engine);

		const entity = new Entity();
		entity.add(Position, {z: 1000});
		entity.add(this.graphics = new Graphics());



		engine.addEntity(entity);
	}

	public updateFixed(deltaTime: number) {
		this.graphics.clear();
		this.graphics.beginFill(0x00ff00, 1);
		this.graphics.drawRect(0, 0, 400, 50);

		if(this.queries.snapshotState.first) {
			const state = this.queries.snapshotState.first.get(HockeySnapshotSyncState);
			const { serverTick } = this.queries.pingState.first.get(ClientPingState);

			for (let index = 0; index < 400; index++) {
				const targetTick = (serverTick - index);
				const position = 400 - index;

				if(state.snapshotsRewrote.includes(targetTick)) {

					const amount = state.snapshotsRewrote.filter((a) => a == targetTick).length;

					let color = Color.GreenYellow;

					if(amount > 1) color = Color.Yellow;
					if(amount > 2) color = Color.OrangeRed;
					if(amount > 3) color = Color.Red;
					// if(amount > 2) color = perc2color(25);
					// if(amount > 3) color = Color.BlueViolet;

					this.graphics.beginFill(color, 1);
					this.graphics.drawRect(position, 0, 1, 50);
				}

			}
		}

	}
}


function perc2color(perc) {
	let r, g, b = 0;
	if(perc < 50) {
		r = 255;
		g = Math.round(5.1 * perc);
	}
	else {
		g = 255;
		r = Math.round(510 - 5.10 * perc);
	}
	const h = r * 0x10000 + g * 0x100 + b * 0x1;
	return h;
}


export class HockeySnapshotSyncSystem extends StatefulIterativeSystem<HockeySnapshotSyncState, typeof generateHockeyWorldSnapshotQueries> {

	constructor(protected engine: Engine, protected createPaddle: ClientHockey['createPaddle']) {
		super(makeQuery(any(Session)), new HockeySnapshotSyncState(), generateHockeyWorldSnapshotQueries);
	}

	updateEntityFixed(entity: Entity) {
		// Handle world packets
		const session = entity.get(Session);
		const packets = session.socket.handle<WorldSnapshot<HockeySnapshot>>(PacketOpcode.WORLD);
		packets.forEach(packet => this.updateSnapshot(packet));
	}

	updateFixed(deltaTime: number) {
		this.state.snapshotHistory[this.serverTick] = takeSnapshot(this.queries);

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
		const historicLocalSnapshot = this.state.snapshotHistory[remoteTick];

		// We didn't proccess these frames on client
		if (remoteTick < this.state.receivedServerSnapshot) {
			console.log("👴🏼 Snapshot before my time");
			return;
		}

		// Old update
		if (tick < this.state.latestAuthoritativeSnapshotTick) {
			console.log("👴🏼 Received old/out-of-order packet - Ignoring.");
			return;
		}

		// We have this snapshot
		if (historicLocalSnapshot) {

			const historyMatchesServer = objectIsEqual(historicLocalSnapshot, snapshot);

			if(!historyMatchesServer) {
				console.log("🔌 Out of sync diff - Client diff to server");
				console.log(diff.diffString(historicLocalSnapshot, snapshot));

				if(this.state.snapshotsRewrote.includes(tick)) {
					console.log("Weird")
				}

				applySnapshot(this.queries, snapshot);

				// Over ride the old snapshot with the servers new one
				Object.assign(historicLocalSnapshot, takeSnapshot(this.queries));

				// Check what we've applied is right
				const appliedCorrectly = objectIsEqual(historicLocalSnapshot, snapshot);

				if(!appliedCorrectly) {
					console.log("🛑 Couldn't apply serverSnapshot!")
					console.log(diff.diffString(historicLocalSnapshot, snapshot));
				}

				this.state.latestAuthoritativeSnapshotTick = tick;

				// Revert time back to server snapshots tick
				console.log(`⏪ Rewinding to tick ${remoteTick}. Fast-Forwarding to ${this.serverTick} (${this.serverTick - remoteTick}ticks)`);

				// Since we've applied the servers results of remoteTick, we start applying updates on
				// the ticks after (let currentEmulatedTick = remoteTick + 1)
				for (let currentEmulatedTick = remoteTick + 1; currentEmulatedTick <= this.serverTick; currentEmulatedTick++) {
					const currentEmulatedTickSnapshot = this.state.snapshotHistory[currentEmulatedTick];

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
					this.state.snapshotHistory[currentEmulatedTick] = takeSnapshot(this.queries);

					this.state.snapshotsRewrote.push(currentEmulatedTick);
				}
			}
		}

		this.state.receivedServerSnapshot = tick;
	}

	get serverTick() {
		return this.queries.pingState.first.get(ClientPingState).serverTick;
	}
}

import { Entity, EntitySnapshot } from '@ecs/core/Entity';
import { useQueries, useState } from '@ecs/core/helpers';
import { IterativeSystem } from '@ecs/core/IterativeSystem';
import { all, any, makeQuery } from '@ecs/core/Query';
import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { ServerConnectionState } from './ServerConnectionSystem';

const MAX_PING_DELAY = 2000;
const PING_INTERVAL = 3000;

export default class ServerPingSystem extends IterativeSystem {
	protected state = useState(this, new ServerPingState());

	protected queries = useQueries(this, {
		serverConnection: all(ServerConnectionState)
	});

	constructor(tickRate: number, pingInterval = PING_INTERVAL) {
		super(makeQuery(any(Session)));

		this.state.serverTickRate = tickRate;
		this.state.serverPingInterval = pingInterval;
	}

	public updateFixed(dt: number) {
		this.state.serverTime += dt;
		this.state.timeSinceLastPing += dt;
		this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);

		if (this.state.timeSinceLastPing >= this.state.serverPingInterval) {
			this.state.timeSinceLastPing = 0;

			const { broadcast } = this.queries.serverConnection.first.get(ServerConnectionState);

			broadcast({
				opcode: PacketOpcode.SERVER_SYNC_PING,
				serverTime: performance.now()
			});
		}

		super.updateFixed(dt);
	}

	protected updateEntityFixed(entity: Entity, dt: number): void {
		// Disconnect players that don't respond to ping
		const session = entity.get(Session);
		if (
			session.lastPongResponse != -1 &&
			performance.now() - session.lastPongResponse > this.state.serverPingInterval + MAX_PING_DELAY
		) {
			console.log(`Disconnecting player ${performance.now() - session.lastPongResponse}`);
			console.log(this.state.serverPingInterval);
			// We should send a disconnect packet to player...
			const { disconnect } = this.queries.serverConnection.first.get(ServerConnectionState);
			disconnect(entity);
		}
	}

	protected entityAdded = (entity: EntitySnapshot) => {
		const session = entity.get(Session);
		session.socket.send({
			opcode: PacketOpcode.SERVER_SYNC_PING,
			serverTime: performance.now()
		});

		session.socket.handleImmediate(packet => {
			switch (packet.opcode) {
				case PacketOpcode.CLIENT_SYNC_PONG: {
					session.lastPongResponse = performance.now();
					session.rtt = performance.now() - packet.serverTime;
					session.socket.send({
						opcode: PacketOpcode.SERVER_SYNC_RESULT,
						clientTime: packet.clientTime,
						serverTime: this.state.serverTime,
						serverTick: this.state.serverTick,
						serverTickRateMs: this.state.serverTickRateMs
					});
				}
			}
		});
	};
}

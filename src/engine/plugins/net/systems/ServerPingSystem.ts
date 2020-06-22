import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { ServerConnectionState } from './ServerConnectionSystem';

// export const ServerPingStateQuery = {
// 	serverPing: makeQuery(all(ServerPingState))
// };

export default class ServerPingSystem extends IterativeSystem {
	protected state = useState(this, new ServerPingState());

	protected queries = useQueries(this, {
		serverConnection: all(ServerConnectionState)
	});

	constructor(tickRate: number, pingInterval = 3000) {
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
		if (session.lastPongResponse != -1 && performance.now() - session.lastPongResponse > this.state.serverPingInterval + 1000) {
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
					const rtt = performance.now() - packet.serverTime;
					console.log(`⏱ Server estimated RTT: ${rtt}`);
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

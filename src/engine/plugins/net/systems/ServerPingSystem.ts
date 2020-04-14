import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import { Query } from '@ecs/ecs/Query';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { performance } from 'perf_hooks';
import { PacketOpcode } from '../components/Packet';
import { ServerPingState } from '../components/ServerPingState';
import Session from '../components/Session';
import { ServerConnectionState } from './ServerConnectionSystem';

type SeverPingSystemQueries = {
	connection: Query;
};

export default class ServerPingSystem extends StatefulIterativeSystem<ServerPingState, SeverPingSystemQueries> {
	constructor(tickRate: number, pingInterval = 5000) {
		super(makeQuery(any(Session)), new ServerPingState(tickRate, pingInterval), {
			connection: makeQuery(all(ServerConnectionState))
		});
	}

	public updateFixed(deltaTime: number) {
		this.state.serverTime += deltaTime;
		this.state.timeSinceLastPing += deltaTime;
		this.state.serverTick = Math.floor(this.state.serverTime / this.state.serverTickRateMs);

		if (this.state.timeSinceLastPing >= this.state.serverPingInterval) {
			this.state.timeSinceLastPing = 0;

			const { broadcast } = this.queries.connection.first.get(ServerConnectionState);

			broadcast(
				{
					opcode: PacketOpcode.SERVER_SYNC_PING,
					serverTime: performance.now()
				},
				true
			);

			console.log(`⏱ Sending ping`);
		}

		super.updateFixed(deltaTime);
	}

	protected updateEntityFixed(entity: Entity, dt: number): void {
		const session = entity.get(Session);
		session.serverTick = this.state.serverTick;
		session.serverTime = this.state.serverTime;

		// Disconnect players that don't respond to ping
		if (session.lastPongResponse != -1 && performance.now() - session.lastPongResponse > this.state.serverPingInterval + 1000) {
			console.log('Disconnecting player ' + (performance.now() - session.lastPongResponse));
			console.log(this.state.serverPingInterval);
			// We should send a disconnect packet to player...
			const { disconnect } = this.queries.connection.first.get(ServerConnectionState);
			disconnect(entity);
		}
	}

	protected entityAdded = (entity: EntitySnapshot) => {
		const session = entity.get(Session);
		session.socket.sendImmediate({
			opcode: PacketOpcode.SERVER_SYNC_PING,
			serverTime: performance.now()
		});

		session.socket.handleImmediate(packet => {
			switch (packet.opcode) {
				case PacketOpcode.CLIENT_SYNC_PONG: {
					session.lastPongResponse = performance.now();
					const rtt = performance.now() - packet.serverTime;
					console.log(`⏱ Server estimated RTT: ${rtt}`);
					session.socket.sendImmediate({
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
